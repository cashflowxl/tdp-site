# 领地在线客服｜第一版运行清单

状态：内部执行说明，不对外发布，不作为客户承诺。

## 当前第一版

- 前台统一名称为“领地在线客服”或“在线客服”。
- 结构化分流：标准 GEO 服务、GEM 电商增长合作、AI 营销培训；认证合伙人资格评估走独立选项。
- 当前会话由独立运营 API 保存，智能助手仅提供固定的初步接待说明；访客可随时申请人工接管。
- 页面只有在服务器明确确认保存后才显示会话成功；失败必须显示“未保存”，不得伪报成功。
- 最小收集：业务类型、公司或品牌、联系人、联系方式、官网或店铺、需求摘要、来源参数、诊断编号和同意记录。禁止收集密码、验证码、身份证件原件或无关敏感信息。

## 飞书唯一底账接入门槛

- 只在服务端配置飞书企业应用凭据、目标 Base 和数据表标识；禁止写入 HTML、客户端 JavaScript、公开仓库或日志。
- 先验证企业应用对既有目标表的真实写入和读回权限，再启用 `POST /api/consult`。
- Base 写入成功后才返回 `stored: true` 与 `lead_id`；Base 写入失败返回非 2xx。
- 飞书提醒或邮箱备份失败时，不重复创建 lead；记录通知状态并进入重试。SQLite 会话可保留，但不作为客资唯一底账。
- 待配置项只记录环境变量名称，不记录值：`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_BITABLE_APP_TOKEN`、`FEISHU_TABLE_ID`、提醒目标以及邮件 provider/收件配置。

## `/api/consult` 数据契约

请求至少包含：

- `client_request_id`、`lead_id`、`session_id`、`created_at`
- `source_page`、`source`、`utm_source`、`utm_medium`、`utm_campaign`、`referrer`
- `service_line`、`company_brand`、`contact_name`、`contact`、`website`
- `need_summary`、`diagnosis_id`、`consent_version`、`consent`
- `messages_summary`、`handoff_status`
- `knowledge_version`、`confidence`、`handoff_reason`、`resolution_status`

成功响应至少包含：`lead_id`、`session_id`、`stored: true`、`handoff_status`、`notification_status`。实现幂等键、速率限制、长度校验、最小化日志与不可猜的会话令牌，避免用联系方式作为长期读取凭据。

## 知识库与 85% 内部目标

- 先冻结 FAQ、产品、价格、能力边界、隐私和转人工规则，形成带版本号的知识集。
- 同步冻结测试问题集，覆盖三大业务、价格与范围、诊断方法、GEM 条件、培训、隐私、合同和拒答边界。
- 内部指标定义为：有效测试问题中，一次答复正确解决的问题数 / 有效测试问题总数。
- 未解决、低置信度、涉及报价合同、隐私、账号权限、付款或个案事实的问题必须转人工。
- 达到并持续稳定不低于 85% 后，再评估是否对外描述自动服务能力；当前官网不得承诺覆盖率。

## 上线验收

- 桌面、手机与键盘完成三业务分流、来源/UTM/诊断编号传递、同意勾选、成功与失败语义、消息追加和人工接管。
- 对话框持续显示低干扰提示：“由智能助手提供初步答复，可随时转人工”。
- 验证错误时页面不丢失已填内容，不显示虚假成功，不把任何服务器凭据送到浏览器。
