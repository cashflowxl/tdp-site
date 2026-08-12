/*
 * Lingdi AI operations API — first internal-test backend.
 * It deliberately excludes payment credentials, upstream credentials and any
 * customer login/session material. Payment confirmation and fulfilment remain
 * manual until compliant merchant payments and an authorised upstream API exist.
 */
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'lingdi.sqlite');
const adminToken = process.env.ADMIN_TOKEN || '';
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:4174').split(',').map((value) => value.trim()).filter(Boolean));

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    service_code TEXT NOT NULL,
    service_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    customer_email TEXT NOT NULL,
    channel_id TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(channel_id) REFERENCES channels(id)
  );
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    category TEXT NOT NULL,
    contact TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    channel_id TEXT,
    order_id TEXT,
    created_at TEXT NOT NULL
  );
`);

const services = {
  plus: { name: 'ChatGPT Plus 1个月', amountCents: 13800 },
  gpt5: { name: 'GPT 5X', amountCents: 79800 },
  gpt20: { name: 'GPT 20X', amountCents: 129800 }
};

function now() { return new Date().toISOString(); }
function json(response, status, body, origin) {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  if (origin && allowedOrigins.has(origin)) headers['access-control-allow-origin'] = origin;
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}
function error(response, status, message, origin) { json(response, status, { error: message }, origin); }
function requestBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => { raw += chunk; if (raw.length > 64 * 1024) request.destroy(); });
    request.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('请求格式不正确')); } });
    request.on('error', reject);
  });
}
function newId(prefix) { return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; }
function admin(request) {
  if (!adminToken) return false;
  const value = request.headers.authorization || '';
  const supplied = Buffer.from(value);
  const expected = Buffer.from(`Bearer ${adminToken}`);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}
function requireAdmin(request, response, origin) {
  if (admin(request)) return true;
  error(response, 401, '需要管理后台授权', origin);
  return false;
}
function list(sql, ...params) { return db.prepare(sql).all(...params); }
function one(sql, ...params) { return db.prepare(sql).get(...params); }

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (request.method === 'OPTIONS') {
    const headers = { 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS', 'access-control-allow-headers': 'content-type,authorization', 'access-control-max-age': '86400' };
    if (origin && allowedOrigins.has(origin)) headers['access-control-allow-origin'] = origin;
    response.writeHead(204, headers); response.end(); return;
  }
  const url = new URL(request.url, `http://${request.headers.host}`);
  const method = request.method || 'GET';
  try {
    if (method === 'GET' && url.pathname === '/health') return json(response, 200, { ok: true, service: 'lingdi-operations-api', at: now() }, origin);
    if (method === 'GET' && url.pathname === '/api/public/services') return json(response, 200, { services }, origin);
    if (method === 'POST' && url.pathname === '/api/public/events/visit') {
      const body = await requestBody(request);
      const proposedChannelId = typeof body.channelId === 'string' && body.channelId.length < 80 ? body.channelId : null;
      const channelId = proposedChannelId && one('SELECT id FROM channels WHERE id=? AND status=?', proposedChannelId, 'active') ? proposedChannelId : null;
      db.prepare('INSERT INTO events(type, channel_id, created_at) VALUES(?,?,?)').run('visit', channelId, now());
      return json(response, 201, { ok: true }, origin);
    }
    if (method === 'POST' && url.pathname === '/api/public/orders') {
      const body = await requestBody(request);
      const service = services[body.serviceCode];
      const email = typeof body.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : '';
      if (!service || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(response, 400, '请提供有效服务方案和邮箱', origin);
      const id = newId('LD'); const createdAt = now();
      const proposedChannelId = typeof body.channelId === 'string' && body.channelId.length < 80 ? body.channelId : null;
      const channelId = proposedChannelId && one('SELECT id FROM channels WHERE id=? AND status=?', proposedChannelId, 'active') ? proposedChannelId : null;
      db.prepare('INSERT INTO orders(id,service_code,service_name,amount_cents,customer_email,channel_id,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
        .run(id, body.serviceCode, service.name, service.amountCents, email, channelId, '待付款核对', createdAt, createdAt);
      db.prepare('INSERT INTO events(type,channel_id,order_id,created_at) VALUES(?,?,?,?)').run('order_created', channelId, id, createdAt);
      return json(response, 201, { id, status: '待付款核对', serviceName: service.name, amountCents: service.amountCents }, origin);
    }
    if (method === 'GET' && url.pathname.startsWith('/api/public/orders/')) {
      const id = decodeURIComponent(url.pathname.slice('/api/public/orders/'.length));
      const email = (url.searchParams.get('email') || '').trim().toLowerCase();
      const order = one('SELECT id,service_name,amount_cents,status,created_at,updated_at FROM orders WHERE id=? AND customer_email=?', id, email);
      if (!order) return error(response, 404, '未找到匹配订单', origin);
      return json(response, 200, { order }, origin);
    }
    if (method === 'POST' && url.pathname === '/api/public/tickets') {
      const body = await requestBody(request);
      const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const category = typeof body.category === 'string' ? body.category.trim() : '售后咨询';
      if (!contact || !message || contact.length > 160 || message.length > 2000) return error(response, 400, '请填写联系方式和问题说明', origin);
      const id = newId('SUP'); const createdAt = now();
      const proposedOrderId = typeof body.orderId === 'string' ? body.orderId.trim() : null;
      const orderId = proposedOrderId && one('SELECT id FROM orders WHERE id=?', proposedOrderId) ? proposedOrderId : null;
      db.prepare('INSERT INTO tickets(id,order_id,category,contact,message,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)')
        .run(id, orderId || null, category, contact, message, '待处理', createdAt, createdAt);
      return json(response, 201, { id, status: '待处理' }, origin);
    }
    if (method === 'GET' && url.pathname === '/api/admin/dashboard') {
      if (!requireAdmin(request, response, origin)) return;
      const summary = {
        orders: one('SELECT COUNT(*) AS count FROM orders').count,
        pendingOrders: one("SELECT COUNT(*) AS count FROM orders WHERE status IN ('待付款核对','待履约')").count,
        openTickets: one("SELECT COUNT(*) AS count FROM tickets WHERE status != '已关闭'").count,
        visits: one("SELECT COUNT(*) AS count FROM events WHERE type='visit'").count
      };
      return json(response, 200, { summary, recentOrders: list('SELECT id,service_name,amount_cents,channel_id,status,created_at FROM orders ORDER BY created_at DESC LIMIT 50'), tickets: list('SELECT id,order_id,category,contact,status,created_at FROM tickets ORDER BY created_at DESC LIMIT 50'), channels: list('SELECT id,name,status,created_at FROM channels ORDER BY created_at DESC LIMIT 50') }, origin);
    }
    if (method === 'POST' && url.pathname === '/api/admin/channels') {
      if (!requireAdmin(request, response, origin)) return;
      const body = await requestBody(request); const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name || name.length > 80) return error(response, 400, '请填写渠道名称', origin);
      const id = `LD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; const createdAt = now();
      db.prepare('INSERT INTO channels(id,name,status,created_at) VALUES(?,?,?,?)').run(id, name, 'active', createdAt);
      return json(response, 201, { id, name, status: 'active' }, origin);
    }
    const match = url.pathname.match(/^\/api\/admin\/(orders|tickets)\/([^/]+)$/);
    if (method === 'PATCH' && match) {
      if (!requireAdmin(request, response, origin)) return;
      const body = await requestBody(request); const status = typeof body.status === 'string' ? body.status.trim() : '';
      const table = match[1]; const id = decodeURIComponent(match[2]);
      const allowed = table === 'orders' ? ['待付款核对', '待履约', '已交付', '已关闭'] : ['待处理', '处理中', '已关闭'];
      if (!allowed.includes(status)) return error(response, 400, '状态不合法', origin);
      const result = db.prepare(`UPDATE ${table} SET status=?, updated_at=? WHERE id=?`).run(status, now(), id);
      if (!result.changes) return error(response, 404, '记录不存在', origin);
      return json(response, 200, { ok: true, id, status }, origin);
    }
    return error(response, 404, '接口不存在', origin);
  } catch (cause) {
    console.error(cause);
    return error(response, 500, '服务暂时不可用', origin);
  }
});

server.listen(port, host, () => console.log(`Lingdi operations API listening on http://${host}:${port}`));
