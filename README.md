# cf-shortlink

Cloudflare Worker 一体化短链接系统：匿名用户可无限次创建短链（不可修改/删除），管理员可在同一 Worker 内查看、修改、删除短链。

## 功能概览
- **匿名用户**：无需登录，可重复提交；创建成功后弹出窗口，提供复制、关闭与新窗口打开按钮。
- **重定向**：访问 `/:code` 自动 302，支持禁用/软删除。
- **管理员**：访问 `/admin`，填入 Bearer Token（`ADMIN_TOKEN` 环境变量）即可管理短链列表、更新、启用/禁用、删除。
- **存储**：D1 数据库存储短链映射。

## 项目结构
- `worker/src/index.ts`：Worker 路由、前端页面模板、创建/重定向/管理接口逻辑。
- `schema.sql`：D1 数据库表结构。
- `wrangler.toml`：Worker 配置与 D1 绑定。

## 本地开发
```bash
npm install
npm run dev
```

## 部署到 Cloudflare Worker
1) **准备 D1**
```bash
wrangler d1 create shortlinks
# 记录生成的 database_id，填入 wrangler.toml 的 d1_databases.database_id
wrangler d1 migrations create --name init --database shortlinks
wrangler d1 migrations apply shortlinks
```

2) **配置环境变量**
```bash
wrangler secret put ADMIN_TOKEN   # 管理后台使用的 Bearer Token
```

3) **部署**
```bash
wrangler deploy
```

> 部署后，首页 `/` 提供创建表单，`/admin` 为后台页面，`/:code` 负责重定向。

## API 速览
- `POST /api/create`：{ url, note? } → { code }
- `GET /:code`：重定向到目标链接
- 管理员接口（需 `Authorization: Bearer <ADMIN_TOKEN>`）：
  - `GET /api/admin/links?page=1&pageSize=20`
  - `PATCH /api/admin/links/:id`：更新 target_url/note/is_active
  - `DELETE /api/admin/links/:id`：软删除

## 管理后台操作提示
- `/admin` 页面输入 Token 后会缓存到 localStorage，后续请求自动携带。
- 表格行内支持启用/禁用、编辑、删除；编辑会弹出浏览器 prompt 以快速修改目标地址与备注。

## 开发说明
- 如需调整样式或动效，可在 `worker/src/index.ts` 中直接修改内置 HTML/CSS。无需单独的 Pages 部署或静态资源存储。
