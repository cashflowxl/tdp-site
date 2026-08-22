# 领地官网唯一源码、预览与工作树规则

更新日期：2026-08-20

## 1. 唯一权威源码

本轮及后续官网改动的唯一权威工作副本为：

```text
/Users/jackiel/Documents/Codex/2026-08-11/tdp-site/work/repo
```

除非用户重新明确指定，任何 `/private/tmp` 发布快照、Codex 临时工作树、旧语音窗口目录、GitHub 页面或线上抓取副本都不能替代该路径成为写入源。

开始写入前必须：

1. 明确一个协调任务和一个写入者；其他任务只读。
2. 记录 `git status --short --branch`、目标文件 SHA-256 与修改时间。
3. 将目标文件复制到 `work/.codex-snapshots/<timestamp>-<scope>/`。
4. 至少做两次短间隔只读检查；若目标文件继续变化，立即停止写入。
5. 只保留一个本地预览入口，并在报告中写明端口和源码根。

## 2. 唯一本地预览方式

从权威源码根启动纯静态预览：

```bash
cd "/Users/jackiel/Documents/Codex/2026-08-11/tdp-site/work/repo"
python3 -m http.server 8052 --bind 127.0.0.1
```

预览地址：

- 中文首页：http://127.0.0.1:8052/
- 英文首页：http://127.0.0.1:8052/en/

端口已被占用时不要随意再开多个长期服务；先确认占用者和源码根，再由唯一协调者指定替代端口并更新本文档。

## 3. 生产与部署边界

- 生产网址：https://www.terradigitalpower.com/
- 只读核验显示生产由 Vercel 响应。
- 2026-08-20 本轮接管前，生产首页、共享 GEO 样式和旧地球图分别与权威工作副本的以下 SHA-256 一致：
  - `index.html`: `bc5cd663d0daaf010452d19ba8319f8d80cbd5578c736cd1a87998ecc3389967`
  - `lingdi-geo.css`: `745a31f2dd125ff637518c0fda6ce01a28a2d59dd972a50dd903550bac9e5dc3`
  - `lingdi-earth-nasa-bmng-1600.jpg`: `91f969a8a96e2cdda33ffc73cae333a5ca7a0dcebfc51dd9aca1bdfa6b415664`
- 本轮地球改造仅在本地进行，因此改造后本地文件与生产不一致是预期状态，不得据此自动发布。
- `origin/main` 与接管时生产首页不一致；权威工作副本也没有可据此自动推断的本地 Vercel 项目绑定。发布触发来源必须在另一次获得明确授权的发布任务中重新核验。
- 本轮禁止提交、推送、部署、发布、修改域名或线上设置。

Vercel/CDN 的 `last-modified` 可能反映边缘取回时间，不能单独当作部署时间证据。

## 4. 工作树与重复目录分类

### 当前生产一致快照——保留、只读

- `/private/tmp/lingdi-global-release.baOM66`

它在接管时与权威工作副本的公共站点文件一致，但没有 `.git` 或 `.vercel` 元数据。它是可恢复发布快照，不是源码，不得继续写入。

### 注册工作树或活跃预览——保留、不移动

- `/private/tmp/lingdi-geo-release.4qK9IP`
- 旧预览 `127.0.0.1:8051`

该目录仍是 Git 注册工作树且存在预览进程。除非用户单独授权并完成停用核验，不得移动、删除或改写。

### 可追溯源素材——已归档、保留

- `work/archive/source-assets/20260820-2310-solar-system-scope-earth-three-0.185.1`

保存本轮官方纹理下载、格式转换产物、Three.js 官方包和源文件清单；不是网站运行目录。

### 已确认过时且未引用——已可恢复隔离

- `work/archive/quarantine/20260820-232133-obsolete-payment-test/internal-payment-test.html`
- `work/archive/quarantine/20260820-232133-obsolete-payment-test/local-test-assets/`

它们未被站内引用、未被 Git 跟踪、生产路径返回 404，并包含旧个人收款测试素材。已移出网站服务目录但没有永久删除；恢复规则见隔离目录内 `MANIFEST.md`。

### 无法确认用途或可能存在外部引用——保留

- `/private/tmp` 中未注册且无活跃进程的旧 `stage`、`readback`、`release` 目录：虽然部分首页哈希已过时，但所有者和外部用途尚未确认，本轮不移动。
- `wx-share-logo-v3.html`：站内无入链但生产返回 200，可能仍有外部微信链接。
- `lingdi-geo-share-square-v1.*`、`lingdi-geo-og.svg`、微信分享 PNG：可能受外部分享缓存引用。
- `geo.html`、`geo-baseline.html` 等业务页，以及 `lingdi-ai.html` 旧 URL 兼容跳转：仍被首页、导航、站点地图、`llms.txt` 或 README 引用，不是重复首页。

对这些保留项，后续只有在“无站内引用、无生产引用、无外部链接、无活跃进程、所有者确认”五项同时成立时，才可移入日期化 archive；仍不得直接永久删除。

## 5. 首页地球资源与许可

- 运行资源：`assets/earth/`
- 本地模块：`assets/earth/lingdi-earth.js`
- 纹理来源与改动记录：`assets/earth/ATTRIBUTION.md`
- Solar System Scope Earth texture pack：CC BY 4.0
- Three.js 0.185.1：MIT

首页可见归因必须保留素材来源、许可证链接、修改说明和“不代表背书”边界。不得复制 SpaceX 素材、代码、Logo 或品牌元素。

## 6. 发布前的单写入者交接

任何未来发布任务都必须先：

1. 确认本文件中的权威路径仍有效。
2. 确认没有其他窗口或代理写同一批文件。
3. 复核本地变更清单、纹理许可、桌面/移动截图、reduced-motion、WebGL 回退和控制台日志。
4. 明确本次发布的提交、分支、Vercel 项目、域名映射和回滚点。
5. 获得用户对“提交 / 推送 / 部署 / 发布”中实际所需动作的逐项授权。

本地构建或预览通过不等于已经发布；Vercel 页面可访问也不等于本地工作副本是当前部署来源。
