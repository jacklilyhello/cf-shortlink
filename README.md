# cf-shortlink

Cloudflare Pages + Workers 的无服务器短链接系统：匿名用户可创建一次短链，管理员可查看/修改/删除所有短链。

## 功能概览
- **匿名用户**：无需登录，提交一次短链后前端用 `localStorage` 锁定，不再展示表单。
- **重定向**：访问 `/:code` 自动 302 到目标地址，支持禁用/软删除。
- **管理员**：使用 Bearer Token（`ADMIN_TOKEN` 环境变量）访问 `/admin` 页面并调用 `/api/admin/*` 接口，支持列表、更新、删除。
- **存储**：D1 数据库存储短链映射，默认软删除记录。

## 项目结构
- `pages/`：Cloudflare Pages 静态文件
  - `/`：匿名创建页
  - `/created`：创建成功展示页
  - `/admin`：简易后台（输入 Token 后管理）
- `worker/`: Cloudflare Worker 源码
  - `src/index.ts`：请求路由、创建、重定向、管理接口实现
- `schema.sql`：D1 数据库表结构
- `wrangler.toml`：Worker 配置与 D1 绑定

## 本地开发
```bash
npm install
npm run dev
```

## 部署要点
- 在 Cloudflare Pages 绑定 `pages/` 目录。
- 同域路由绑定 Worker，配置 D1 数据库并设置环境变量：
  - `ADMIN_TOKEN`：管理员 Bearer Token。
- 使用 `schema.sql` 初始化 D1：
  ```bash
  wrangler d1 migrations create --name init --database shortlinks
  # 将 schema.sql 内容拷贝到迁移文件，再执行
  wrangler d1 migrations apply shortlinks
  ```

## API 速览
- `POST /api/create`：{ url, note? } → { code }
- `GET /:code`：重定向到目标链接
- 管理员接口（需 `Authorization: Bearer <ADMIN_TOKEN>`）：
  - `GET /api/admin/links?page=1&pageSize=20`
  - `PATCH /api/admin/links/:id`：更新 target_url/note/is_active
  - `DELETE /api/admin/links/:id`：软删除
