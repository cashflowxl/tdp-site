#!/usr/bin/env python3
"""Lingdi AI internal operations test API.

This service intentionally holds no payment credential, upstream credential or
customer account/session material.  Payment confirmation and fulfilment stay
manual until the company has compliant merchant-payment and supplier access.
"""

import hmac
import hashlib
import json
import os
import re
import secrets
import sqlite3
from datetime import datetime, timezone
from base64 import urlsafe_b64decode, urlsafe_b64encode
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8787"))
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", Path(__file__).parent / "data" / "lingdi.sqlite"))
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")
AUTH_SECRET = os.getenv("AUTH_SECRET", "")
ALLOWED_ORIGINS = {value.strip() for value in os.getenv("ALLOWED_ORIGINS", "http://127.0.0.1:4174").split(",") if value.strip()}

SERVICES = {
    "plus": {"name": "ChatGPT Plus 1个月", "amountCents": 13800},
    "gpt5": {"name": "GPT 5X", "amountCents": 79800},
    "gpt20": {"name": "GPT 20X", "amountCents": 129800},
}


def now():
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix):
    return f"{prefix}-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{secrets.token_hex(4).upper()}"


def password_matches(password):
    """Verify a PBKDF2 password stored as pbkdf2_sha256$iterations$salt$hash."""
    try:
        scheme, iterations, salt, expected = ADMIN_PASSWORD_HASH.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations))
        return hmac.compare_digest(urlsafe_b64encode(digest).decode().rstrip("="), expected)
    except (AttributeError, ValueError):
        return False


def issue_session():
    if not AUTH_SECRET:
        return ""
    payload = json.dumps({"sub": ADMIN_USERNAME, "nonce": secrets.token_urlsafe(12)}, separators=(",", ":")).encode()
    encoded = urlsafe_b64encode(payload).decode().rstrip("=")
    signature = hmac.new(AUTH_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
    return f"v1.{encoded}.{urlsafe_b64encode(signature).decode().rstrip('=')}"


def session_matches(token):
    try:
        version, encoded, signature = token.split(".", 2)
        if version != "v1" or not AUTH_SECRET:
            return False
        expected = urlsafe_b64encode(hmac.new(AUTH_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()).decode().rstrip("=")
        if not hmac.compare_digest(signature, expected):
            return False
        payload = json.loads(urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        return payload.get("sub") == ADMIN_USERNAME
    except (ValueError, json.JSONDecodeError):
        return False


def connection():
    db = sqlite3.connect(DATABASE_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def initialise_database():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connection() as db:
        db.executescript("""
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS channels (
            id TEXT PRIMARY KEY, name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY, service_code TEXT NOT NULL,
            service_name TEXT NOT NULL, amount_cents INTEGER NOT NULL,
            customer_email TEXT NOT NULL, channel_id TEXT, status TEXT NOT NULL,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
            FOREIGN KEY(channel_id) REFERENCES channels(id)
          );
          CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY, order_id TEXT, category TEXT NOT NULL,
            contact TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
            FOREIGN KEY(order_id) REFERENCES orders(id)
          );
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL,
            channel_id TEXT, order_id TEXT, created_at TEXT NOT NULL
          );
        """)


def exists_active_channel(channel_id):
    if not channel_id or len(channel_id) >= 80:
        return None
    with connection() as db:
        return channel_id if db.execute("SELECT 1 FROM channels WHERE id=? AND status='active'", (channel_id,)).fetchone() else None


class Handler(BaseHTTPRequestHandler):
    server_version = "LingdiOperations/1.0"

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} - {fmt % args}")

    def origin(self):
        origin = self.headers.get("Origin")
        return origin if origin in ALLOWED_ORIGINS else None

    def send_json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        if self.origin():
            self.send_header("Access-Control-Allow-Origin", self.origin())
        self.end_headers()
        self.wfile.write(body)

    def error_json(self, code, message):
        self.send_json(code, {"error": message})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type,authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        if self.origin():
            self.send_header("Access-Control-Allow-Origin", self.origin())
        self.end_headers()

    def body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("请求格式不正确")
        if length > 64 * 1024:
            raise ValueError("请求内容过大")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("请求格式不正确") from exc

    def is_admin(self):
        supplied = self.headers.get("Authorization", "")
        if not supplied.startswith("Bearer "):
            return False
        token = supplied.removeprefix("Bearer ")
        # ADMIN_TOKEN remains valid only as a migration fallback. New browser
        # sessions are created by /api/admin/login with a password hash.
        return (bool(ADMIN_TOKEN) and hmac.compare_digest(token, ADMIN_TOKEN)) or session_matches(token)

    def require_admin(self):
        if self.is_admin():
            return True
        self.error_json(401, "需要管理后台授权")
        return False

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            return self.send_json(200, {"ok": True, "service": "lingdi-operations-api", "at": now()})
        if parsed.path == "/api/public/services":
            return self.send_json(200, {"services": SERVICES})
        if parsed.path.startswith("/api/public/orders/"):
            order_id = unquote(parsed.path.removeprefix("/api/public/orders/"))
            email = parse_qs(parsed.query).get("email", [""])[0].strip().lower()
            with connection() as db:
                row = db.execute("SELECT id,service_name,amount_cents,status,created_at,updated_at FROM orders WHERE id=? AND customer_email=?", (order_id, email)).fetchone()
            if not row:
                return self.error_json(404, "未找到匹配订单")
            return self.send_json(200, {"order": dict(row)})
        if parsed.path == "/api/admin/dashboard":
            if not self.require_admin():
                return
            with connection() as db:
                summary = {
                    "orders": db.execute("SELECT COUNT(*) FROM orders").fetchone()[0],
                    "pendingOrders": db.execute("SELECT COUNT(*) FROM orders WHERE status IN ('待付款核对','待履约')").fetchone()[0],
                    "openTickets": db.execute("SELECT COUNT(*) FROM tickets WHERE status != '已关闭'").fetchone()[0],
                    "visits": db.execute("SELECT COUNT(*) FROM events WHERE type='visit'").fetchone()[0],
                }
                result = {
                    "summary": summary,
                    "recentOrders": [dict(row) for row in db.execute("SELECT id,service_name,amount_cents,channel_id,status,created_at FROM orders ORDER BY created_at DESC LIMIT 50")],
                    "tickets": [dict(row) for row in db.execute("SELECT id,order_id,category,contact,status,created_at FROM tickets ORDER BY created_at DESC LIMIT 50")],
                    "channels": [dict(row) for row in db.execute("SELECT id,name,status,created_at FROM channels ORDER BY created_at DESC LIMIT 50")],
                }
            return self.send_json(200, result)
        return self.error_json(404, "接口不存在")

    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            payload = self.body()
            if parsed.path == "/api/admin/login":
                username = payload.get("username", "").strip() if isinstance(payload.get("username"), str) else ""
                password = payload.get("password", "") if isinstance(payload.get("password"), str) else ""
                if not ADMIN_PASSWORD_HASH or not AUTH_SECRET:
                    return self.error_json(503, "管理员账号尚未完成服务器配置")
                if not hmac.compare_digest(username, ADMIN_USERNAME) or not password_matches(password):
                    return self.error_json(401, "用户名或密码不正确")
                return self.send_json(200, {"token": issue_session(), "username": ADMIN_USERNAME})
            if parsed.path == "/api/public/events/visit":
                channel_id = exists_active_channel(payload.get("channelId") if isinstance(payload.get("channelId"), str) else None)
                with connection() as db:
                    db.execute("INSERT INTO events(type,channel_id,created_at) VALUES(?,?,?)", ("visit", channel_id, now()))
                return self.send_json(201, {"ok": True})
            if parsed.path == "/api/public/orders":
                service = SERVICES.get(payload.get("serviceCode"))
                email = payload.get("customerEmail", "").strip().lower() if isinstance(payload.get("customerEmail"), str) else ""
                if not service or not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
                    return self.error_json(400, "请提供有效服务方案和邮箱")
                channel_id = exists_active_channel(payload.get("channelId") if isinstance(payload.get("channelId"), str) else None)
                order_id, created_at = new_id("LD"), now()
                with connection() as db:
                    db.execute("INSERT INTO orders(id,service_code,service_name,amount_cents,customer_email,channel_id,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)", (order_id, payload["serviceCode"], service["name"], service["amountCents"], email, channel_id, "待付款核对", created_at, created_at))
                    db.execute("INSERT INTO events(type,channel_id,order_id,created_at) VALUES(?,?,?,?)", ("order_created", channel_id, order_id, created_at))
                return self.send_json(201, {"id": order_id, "status": "待付款核对", "serviceName": service["name"], "amountCents": service["amountCents"]})
            if parsed.path == "/api/public/tickets":
                contact = payload.get("contact", "").strip() if isinstance(payload.get("contact"), str) else ""
                message = payload.get("message", "").strip() if isinstance(payload.get("message"), str) else ""
                category = payload.get("category", "售后咨询").strip() if isinstance(payload.get("category"), str) else "售后咨询"
                if not contact or not message or len(contact) > 160 or len(message) > 2000:
                    return self.error_json(400, "请填写联系方式和问题说明")
                proposed_order = payload.get("orderId", "").strip() if isinstance(payload.get("orderId"), str) else ""
                with connection() as db:
                    linked = db.execute("SELECT 1 FROM orders WHERE id=?", (proposed_order,)).fetchone()
                    ticket_id, created_at = new_id("SUP"), now()
                    db.execute("INSERT INTO tickets(id,order_id,category,contact,message,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)", (ticket_id, proposed_order if linked else None, category, contact, message, "待处理", created_at, created_at))
                return self.send_json(201, {"id": ticket_id, "status": "待处理"})
            if parsed.path == "/api/admin/channels":
                if not self.require_admin():
                    return
                name = payload.get("name", "").strip() if isinstance(payload.get("name"), str) else ""
                if not name or len(name) > 80:
                    return self.error_json(400, "请填写渠道名称")
                channel_id, created_at = f"LD-{secrets.token_hex(4).upper()}", now()
                with connection() as db:
                    db.execute("INSERT INTO channels(id,name,status,created_at) VALUES(?,?,?,?)", (channel_id, name, "active", created_at))
                return self.send_json(201, {"id": channel_id, "name": name, "status": "active"})
            return self.error_json(404, "接口不存在")
        except ValueError as exc:
            return self.error_json(400, str(exc))
        except Exception as exc:
            print(exc)
            return self.error_json(500, "服务暂时不可用")

    def do_PATCH(self):
        parsed = urlparse(self.path)
        match = re.match(r"^/api/admin/(orders|tickets)/([^/]+)$", parsed.path)
        if not match:
            return self.error_json(404, "接口不存在")
        if not self.require_admin():
            return
        try:
            payload = self.body()
            table, item_id = match.group(1), unquote(match.group(2))
            status = payload.get("status", "").strip() if isinstance(payload.get("status"), str) else ""
            allowed = ["待付款核对", "待履约", "已交付", "已关闭"] if table == "orders" else ["待处理", "处理中", "已关闭"]
            if status not in allowed:
                return self.error_json(400, "状态不合法")
            with connection() as db:
                cursor = db.execute(f"UPDATE {table} SET status=?, updated_at=? WHERE id=?", (status, now(), item_id))
            if not cursor.rowcount:
                return self.error_json(404, "记录不存在")
            return self.send_json(200, {"ok": True, "id": item_id, "status": status})
        except ValueError as exc:
            return self.error_json(400, str(exc))
        except Exception as exc:
            print(exc)
            return self.error_json(500, "服务暂时不可用")


if __name__ == "__main__":
    initialise_database()
    print(f"Lingdi operations API listening on http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
