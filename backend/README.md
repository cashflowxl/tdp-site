# 领地 AI 运营测试后端

这是前台与管理后台联通的第一版测试服务：创建测试订单、订单查询、售后工单、渠道归因访问，以及管理员订单/工单/渠道查看与状态处理。

它**不包含**支付密钥、客户密码、验证码、Cookie、Session、令牌或天策接口。企业支付、退款和上游履约只能在相应资质、授权 API 与审计机制到位后接入。

## 本机测试

```sh
cd backend
ADMIN_TOKEN='本机测试用随机值' HOST=127.0.0.1 PORT=8787 npm start
```

健康检查：`GET /health`。

## 服务器部署要点

使用 Docker Compose 运行并持久化 `/data`；通过 Caddy/Nginx 将独立 API 子域名反代至 `127.0.0.1:8787`。仓库已包含 `compose.yaml` 与 `Caddyfile.snippet`，但它们不会自行修改服务器或 DNS。

生产环境应使用随机的 `ADMIN_TOKEN`、HTTPS、受限 CORS、每日数据库备份和受控管理员登录，而不是将后台公开给访客。
