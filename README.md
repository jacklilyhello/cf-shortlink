# cf-shortlink

Cloudflare Pages + Workers 的无服务器短链接系统：匿名用户可无限次创建短链（但无法修改/删除），管理员可查看/修改/删除所有短链。

## 功能概览
- **匿名用户**：无需登录，可重复提交短链；生成后会弹窗显示短链接地址并提供复制按钮。
- **重定向**：访问 `/:code` 自动 302 到目标地址，支持禁用/软删除。
- **管理员**：使用 Bearer Token（`ADMIN_TOKEN` 环境变量）访问 `/admin` 页面并调用 `/api/admin/*` 接口，支持列表、更新、删除。
- **存储**：D1 数据库存储短链映射，默认软删除记录。

## 项目结构
- `pages/`：Cloudflare Pages 静态文件（通过 `npm run build:pages` 生成 `dist/` 输出，支持环境变量注入 API 地址）
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

## 一键部署

| 部署目标 | 按钮 |
| --- | --- |
| Cloudflare Workers（API & 重定向） | [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-org/cf-shortlink) |
| Cloudflare Pages（前端静态资源） | [![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-org/cf-shortlink&type=pages) |

> 将 `your-org/cf-shortlink` 替换为你自己的仓库地址，按钮会在 Cloudflare 控制台创建对应的项目并提示绑定 D1。

## 手动部署步骤

1) **准备环境**
   - 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 并登录：`wrangler login`。
   - 确保已经创建 Cloudflare 站点域名（用于 Pages 自定义域和 Worker 路由）。

2) **创建 D1 数据库并导入表结构**
   ```bash
   wrangler d1 create shortlinks
   # 记录返回的绑定名称（如 `DB_shortlinks`），并填入 wrangler.toml 的 d1_databases.name

   # 生成迁移文件，将 schema.sql 内容粘贴进去
   wrangler d1 migrations create --name init --database shortlinks
   wrangler d1 migrations apply shortlinks
   ```

3) **配置 Worker（API/重定向）**
   - 在 `wrangler.toml` 中确认 `name`、`main`、`d1_databases` 已填写。
   - 写入管理员 Token：
     ```bash
     wrangler secret put ADMIN_TOKEN
     ```
   - 部署：
     ```bash
     wrangler deploy
     ```
   - 在 Cloudflare 控制台中为 Worker 添加路由（示例 `https://short.example.com/*`），需与 Pages 自定义域一致，这样 `/api/*` 与 `/:code` 都由 Worker 处理。

4) **部署 Pages（前端）**
   - 在 Cloudflare Pages 创建新项目，选择「从 Git 导入」，**构建命令**填 `npm run build:pages`，**输出目录**填 `dist`。
   - 在 Pages 环境变量里新增 `API_BASE`，值为 Worker 对外地址（例如 `https://short.example.com` 或 `https://your-worker.workers.dev`），前端会自动用它拼接 `/api/*` 请求；留空则使用相对路径。
   - 绑定自定义域（例如 `short.example.com`）。
   - Pages 部署完成后，同域的 Worker 路由即可响应 `/api/*` 与短链跳转，前端将根据 `API_BASE` 请求后端。

5) **验证**
   - 访问首页创建短链成功后，会弹出窗口显示短链并支持一键复制（如需单独页面展示，可访问 `/created?code=...`）。
   - 访问 `/:code` 应跳转到目标链接。
   - 在 `/admin` 输入 `ADMIN_TOKEN` 进行后台管理。

## API 速览
- `POST /api/create`：{ url, note? } → { code }
- `GET /:code`：重定向到目标链接
- 管理员接口（需 `Authorization: Bearer <ADMIN_TOKEN>`）：
  - `GET /api/admin/links?page=1&pageSize=20`
  - `PATCH /api/admin/links/:id`：更新 target_url/note/is_active
  - `DELETE /api/admin/links/:id`：软删除
