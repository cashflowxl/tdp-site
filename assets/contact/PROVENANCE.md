# Jackie 企业微信二维码来源记录

- 用途：领地 GEO / TERRA GEO 官网中英文联系页的公开企业微信入口
- 授权：用户已明确授权在官网联系页公开使用
- 原始文件：
  `/Users/jackiel/Documents/Codex/2026-08-21/realtime-voice-chat-3/work/contact-assets/jackie-wecom-contact-card-source.jpg`
- 原始尺寸：1179 × 2556 JPEG
- 原始 SHA-256：
  `adc076476b3cf13301e51c65cc30ed05fe778e6f86e19724893468b7614fe349`
- 导出文件：`jackie-wecom-qr.png`
- 导出 SHA-256：
  `13a9a8288ad3f10de0d5184956f873ad90901c99f631e06c71a10869aeba7a29`

## 导出方法

1. 从原图按左上角坐标 `x=740, y=1497` 裁切 `346 × 346` 像素。
2. 不缩放、不锐化、不滤镜、不重绘，也不改变二维码模块。
3. 将原样裁图置于 `410 × 410` 的纯白画布中央，四周新增 32 像素纯白边界。
4. 以 PNG 无损保存；网页端只用 CSS 控制显示尺寸。

没有记录、展示或解析输出二维码 payload。

## 解码验证

- macOS Vision：检测到 1 个 QR，payload 存在，置信度 1.000。
- jsQR 1.4.0：独立解码成功。
- 浏览器 1x 与 2x 手机截图：均由 macOS Vision 和 jsQR 再次独立解码成功；
  页面按 206 × 206 CSS 像素显示，410 × 410 原图正好覆盖约 2x 像素密度。
- 微信实体设备扫码：正式发布该联系页前仍需完成。

整张企业微信名片截图及其灰色默认头像不得发布。
