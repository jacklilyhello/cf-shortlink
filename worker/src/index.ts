export interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
}

type LinkRecord = {
  id: number;
  code: string;
  target_url: string;
  note: string | null;
  is_active: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
};

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });

const generateCode = (length = 7) => {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const random = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += alphabet[random[i] % alphabet.length];
  }
  return result;
};

const validateUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isAdminAuthorized = (request: Request, env: Env) => {
  const header = request.headers.get("authorization");
  if (!env.ADMIN_TOKEN || !header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  return token === env.ADMIN_TOKEN;
};

const landingPage = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cloudflare 短链接</title>
    <style>
      :root {
        color-scheme: light;
        --bg: radial-gradient(circle at 10% 20%, #6ee7ff 0, transparent 25%),
          radial-gradient(circle at 80% 0%, #a78bfa 0, transparent 22%),
          radial-gradient(circle at 20% 80%, #34d399 0, transparent 20%),
          radial-gradient(circle at 90% 80%, #f9a8d4 0, transparent 18%),
          #0f172a;
        --card: rgba(255, 255, 255, 0.08);
        --muted: #d8e2ff;
        --primary: #38bdf8;
        --primary-strong: #0ea5e9;
        --border: rgba(255, 255, 255, 0.15);
        --shadow: 0 20px 70px rgba(15, 23, 42, 0.45);
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Inter", "SF Pro Display", system-ui, -apple-system, sans-serif;
        background: var(--bg);
        color: white;
        display: grid;
        place-items: center;
        padding: 32px 16px;
        overflow-x: hidden;
      }
      .halo {
        position: absolute;
        inset: 0;
        background: conic-gradient(from 45deg, rgba(56, 189, 248, 0.25), rgba(244, 114, 182, 0.18), rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.25));
        filter: blur(80px);
        opacity: 0.8;
        z-index: 0;
        animation: rotate 24s linear infinite;
      }
      @keyframes rotate {
        to {
          transform: rotate(360deg);
        }
      }
      .container {
        position: relative;
        z-index: 1;
        width: min(960px, 100%);
      }
      header {
        text-align: center;
        margin-bottom: 28px;
        animation: float 6s ease-in-out infinite;
      }
      @keyframes float {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-6px);
        }
      }
      h1 {
        margin: 0 0 12px;
        font-size: clamp(30px, 6vw, 44px);
        letter-spacing: -0.02em;
      }
      p.lead {
        margin: 0;
        color: var(--muted);
        font-size: 17px;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 24px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(16px);
      }
      form {
        display: grid;
        gap: 16px;
      }
      label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #e2e8f0;
      }
      input,
      textarea {
        width: 100%;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 16px;
        color: white;
        font-size: 15px;
        outline: none;
        transition: border 0.2s, transform 0.2s, box-shadow 0.2s;
      }
      input:focus,
      textarea:focus {
        border-color: rgba(56, 189, 248, 0.8);
        box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.15);
        transform: translateY(-1px);
      }
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }
      button {
        border: none;
        border-radius: 12px;
        padding: 14px 20px;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        color: #0b1224;
        background: linear-gradient(120deg, #38bdf8, #a78bfa);
        box-shadow: 0 12px 30px rgba(56, 189, 248, 0.35);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 40px rgba(56, 189, 248, 0.4);
      }
      button:active {
        transform: translateY(0);
        box-shadow: 0 8px 20px rgba(56, 189, 248, 0.35);
      }
      .muted {
        color: var(--muted);
        font-size: 14px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(56, 189, 248, 0.18);
        color: #e0f2fe;
        border: 1px solid rgba(56, 189, 248, 0.3);
        font-size: 13px;
        letter-spacing: 0.01em;
      }
      .toast {
        position: fixed;
        top: 16px;
        right: 16px;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(56, 189, 248, 0.4);
        color: white;
        padding: 12px 16px;
        border-radius: 14px;
        box-shadow: var(--shadow);
        opacity: 0;
        transform: translateY(-12px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        pointer-events: none;
        z-index: 10;
      }
      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(7, 11, 23, 0.7);
        backdrop-filter: blur(8px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 11;
      }
      .modal-backdrop.show {
        display: flex;
      }
      .modal {
        background: rgba(255, 255, 255, 0.98);
        color: #0b1224;
        border-radius: 16px;
        padding: 24px;
        width: min(440px, 90vw);
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
        animation: pop 0.22s ease;
      }
      @keyframes pop {
        from {
          transform: translateY(8px) scale(0.98);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
      .modal h3 {
        margin: 0 0 10px;
        font-size: 20px;
      }
      .modal p {
        margin: 0 0 14px;
        color: #475569;
      }
      .link-box {
        background: #0b1224;
        color: #e2e8f0;
        padding: 14px;
        border-radius: 12px;
        word-break: break-all;
        font-weight: 600;
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
      }
      .ghost-btn {
        background: rgba(56, 189, 248, 0.15);
        color: #0ea5e9;
        border: 1px solid rgba(56, 189, 248, 0.35);
        box-shadow: none;
        padding: 12px 14px;
      }
      footer {
        margin-top: 18px;
        text-align: center;
        color: var(--muted);
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="halo" aria-hidden="true"></div>
    <div class="container">
      <header>
        <div class="badge">⚡ Cloudflare Worker · 无服务器</div>
        <h1>一键生成你的短链接</h1>
        <p class="lead">匿名用户可无限次创建，生成即用，后台可集中管理。</p>
      </header>
      <div class="card">
        <form id="create-form">
          <div>
            <label for="url">目标地址</label>
            <input id="url" name="url" type="url" placeholder="https://example.com" required />
          </div>
          <div>
            <label for="note">备注（可选）</label>
            <textarea id="note" name="note" rows="2" placeholder="方便后台标记用途"></textarea>
          </div>
          <div class="actions">
            <button type="submit" id="submit">生成短链接</button>
            <span class="muted">无需登录 · 支持无限次创建 · 由 Cloudflare D1 存储</span>
          </div>
        </form>
      </div>
      <footer>需要管理入口？访问 <a href="/admin" style="color: #a5b4fc; text-decoration: none; font-weight: 600;">/admin</a></footer>
    </div>

    <div class="toast" id="toast"></div>

    <div class="modal-backdrop" id="modal">
      <div class="modal">
        <h3>创建成功 🎉</h3>
        <p>短链接已经准备好，点击复制后即可分享。</p>
        <div class="link-box">
          <span id="short-link-text"></span>
          <button class="ghost-btn" id="copy-btn">复制</button>
        </div>
        <div style="display:flex; gap:10px; margin-top:14px;">
          <button class="ghost-btn" id="open-btn">在新窗口打开</button>
          <button class="ghost-btn" id="close-btn" style="margin-left:auto;">关闭</button>
        </div>
      </div>
    </div>

    <script>
      const form = document.getElementById('create-form');
      const submitBtn = document.getElementById('submit');
      const toast = document.getElementById('toast');
      const modal = document.getElementById('modal');
      const shortLinkText = document.getElementById('short-link-text');
      const copyBtn = document.getElementById('copy-btn');
      const closeBtn = document.getElementById('close-btn');
      const openBtn = document.getElementById('open-btn');
      const urlInput = document.getElementById('url');
      const noteInput = document.getElementById('note');
      let currentLink = '';

      function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2400);
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const url = urlInput.value.trim();
        const note = noteInput.value.trim();
        if (!url) return;

        submitBtn.disabled = true;
        submitBtn.textContent = '生成中...';

        try {
          const res = await fetch('/api/create', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url, note: note || undefined }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || '创建失败');
          currentLink = new URL('/' + data.code, window.location.href).href;
          shortLinkText.textContent = currentLink;
          modal.classList.add('show');
          showToast('短链接创建成功');
        } catch (error) {
          showToast((error as Error).message || '请求出错');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = '生成短链接';
        }
      });

      copyBtn.addEventListener('click', async () => {
        if (!currentLink) return;
        await navigator.clipboard.writeText(currentLink);
        showToast('已复制到剪贴板');
      });

      closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
      });

      openBtn.addEventListener('click', () => {
        if (currentLink) window.open(currentLink, '_blank');
      });
    </script>
  </body>
</html>`;

const adminPage = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>短链接后台</title>
    <style>
      body {
        margin: 0;
        background: #0b1224;
        color: #e2e8f0;
        font-family: "Inter", system-ui, -apple-system, sans-serif;
        min-height: 100vh;
      }
      header {
        padding: 18px 20px;
        background: linear-gradient(120deg, #0f172a, #0b1224);
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        position: sticky;
        top: 0;
        z-index: 2;
      }
      h1 {
        margin: 0;
        font-size: 20px;
        letter-spacing: -0.01em;
      }
      main {
        padding: 20px;
        display: grid;
        gap: 16px;
      }
      .panel {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 14px;
        padding: 14px 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      }
      input,
      textarea,
      select {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 10px;
        padding: 10px 12px;
        color: #e2e8f0;
        font-size: 14px;
        outline: none;
      }
      input:focus,
      textarea:focus,
      select:focus {
        border-color: #38bdf8;
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
      }
      button {
        border: none;
        border-radius: 10px;
        padding: 10px 14px;
        background: linear-gradient(120deg, #38bdf8, #a78bfa);
        color: #0b1224;
        font-weight: 700;
        cursor: pointer;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      th, td {
        padding: 12px 10px;
        text-align: left;
        border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      }
      th {
        color: #cbd5e1;
        font-weight: 700;
      }
      tr:hover td {
        background: rgba(56, 189, 248, 0.06);
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(56, 189, 248, 0.12);
        color: #bae6fd;
        border: 1px solid rgba(56, 189, 248, 0.25);
        font-weight: 700;
      }
      .muted { color: #94a3b8; }
      .row-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .small { font-size: 13px; }
    </style>
  </head>
  <body>
    <header>
      <h1>短链接后台</h1>
      <div style="display:flex; gap:8px; align-items:center;">
        <input id="token" type="password" placeholder="Bearer Token" style="min-width:220px;" />
        <button id="save-token">保存</button>
        <button id="refresh">刷新列表</button>
      </div>
    </header>
    <main>
      <div class="panel small muted">提示：Bearer Token 由 Worker 环境变量 ADMIN_TOKEN 决定，填入后自动存入 localStorage。</div>
      <div class="panel">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>目标地址</th>
              <th>备注</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </main>

    <script>
      const tokenInput = document.getElementById('token');
      const saveTokenBtn = document.getElementById('save-token');
      const refreshBtn = document.getElementById('refresh');
      const rows = document.getElementById('rows');

      const getToken = () => localStorage.getItem('ADMIN_TOKEN') || '';
      const setToken = (v) => localStorage.setItem('ADMIN_TOKEN', v);

      tokenInput.value = getToken();

      saveTokenBtn.addEventListener('click', () => {
        setToken(tokenInput.value.trim());
        alert('Token 已保存');
      });

      refreshBtn.addEventListener('click', load);

      async function load() {
        rows.innerHTML = '<tr><td colspan="6" class="muted">加载中...</td></tr>';
        try {
          const res = await fetch('/api/admin/links', {
            headers: { Authorization: 'Bearer ' + getToken() },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || '加载失败');
          rows.innerHTML = '';
          for (const item of data.data) {
            const tr = document.createElement('tr');
            tr.innerHTML =
              '<td><span class="pill">' +
              item.code +
              '</span></td>' +
              '<td style="max-width:260px; word-break:break-all;">' +
              item.target_url +
              '</td>' +
              '<td>' + (item.note || '') + '</td>' +
              '<td>' + (item.is_active ? '启用' : '禁用') + '</td>' +
              '<td class="muted">' + new Date(item.created_at).toLocaleString() + '</td>' +
              '<td class="row-actions"></td>';
            const actions = tr.querySelector('.row-actions');
            const toggle = document.createElement('button');
            toggle.textContent = item.is_active ? '禁用' : '启用';
            toggle.addEventListener('click', () => update(item.id, { is_active: !item.is_active }));
            const edit = document.createElement('button');
            edit.textContent = '编辑';
            edit.addEventListener('click', async () => {
              const target_url = prompt('新的目标地址', item.target_url) || item.target_url;
              const note = prompt('备注（可留空）', item.note || '') || '';
              await update(item.id, { target_url, note });
            });
            const del = document.createElement('button');
            del.textContent = '删除';
            del.addEventListener('click', async () => {
              if (confirm('确认删除？')) await remove(item.id);
            });
            actions.append(toggle, edit, del);
            rows.appendChild(tr);
          }
        } catch (err) {
          rows.innerHTML = '<tr><td colspan="6" class="muted">' + err + '</td></tr>';
        }
      }

      async function update(id, body) {
        await fetch('/api/admin/links/' + id, {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer ' + getToken(),
          },
          body: JSON.stringify(body),
        });
        load();
      }

      async function remove(id) {
        await fetch('/api/admin/links/' + id, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + getToken() },
        });
        load();
      }

      load();
    </script>
  </body>
</html>`;

async function handleCreate(request: Request, env: Env) {
  let payload: { url?: string; note?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetUrl = payload.url?.trim();
  const note = payload.note?.trim() ?? null;

  if (!targetUrl || !validateUrl(targetUrl)) {
    return json({ error: "A valid http/https URL is required" }, { status: 400 });
  }

  const code = generateCode();
  try {
    await env.DB.prepare(
      "INSERT INTO links (code, target_url, note) VALUES (?1, ?2, ?3)"
    )
      .bind(code, targetUrl, note)
      .run();
  } catch (error) {
    return json({ error: "Failed to store short link", details: String(error) }, { status: 500 });
  }

  return json({ code });
}

const ensureAdmin = (request: Request, env: Env) => {
  if (!isAdminAuthorized(request, env)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
};

async function listLinks(url: URL, env: Env) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));
  const offset = (page - 1) * pageSize;

  const { results } = await env.DB.prepare(
    `SELECT * FROM links WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`
  )
    .bind(pageSize, offset)
    .all<LinkRecord>();

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM links WHERE is_deleted = 0`
  ).first<{ total: number }>();

  return json({ data: results ?? [], page, pageSize, total: countRow?.total ?? 0 });
}

async function updateLink(request: Request, env: Env, id: number) {
  let payload: Partial<{ target_url: string; note: string | null; is_active: boolean }>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (payload.target_url !== undefined) {
    if (!validateUrl(payload.target_url)) {
      return json({ error: "Invalid target_url" }, { status: 400 });
    }
    updates.push("target_url = ?");
    params.push(payload.target_url);
  }

  if (payload.note !== undefined) {
    updates.push("note = ?");
    params.push(payload.note);
  }

  if (payload.is_active !== undefined) {
    updates.push("is_active = ?");
    params.push(payload.is_active ? 1 : 0);
  }

  if (!updates.length) {
    return json({ error: "No fields to update" }, { status: 400 });
  }

  params.push(id);

  const statement = `UPDATE links SET ${updates.join(", ")} WHERE id = ? AND is_deleted = 0`;
  await env.DB.prepare(statement).bind(...params).run();

  const updated = await env.DB.prepare(`SELECT * FROM links WHERE id = ?`).bind(id).first<LinkRecord>();
  return json({ data: updated });
}

async function deleteLink(env: Env, id: number) {
  await env.DB.prepare("UPDATE links SET is_deleted = 1 WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

async function redirect(code: string, env: Env) {
  const record = await env.DB.prepare(
    `SELECT target_url, is_active, is_deleted FROM links WHERE code = ?1`
  )
    .bind(code)
    .first<{ target_url: string; is_active: number; is_deleted: number }>();

  if (!record || record.is_deleted || !record.is_active) {
    return new Response("Short link not found", { status: 404 });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: record.target_url },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === "/api/health") {
      return json({ ok: true, timestamp: new Date().toISOString() });
    }

    if (pathname === "/api/create" && request.method === "POST") {
      return handleCreate(request, env);
    }

    if (pathname.startsWith("/api/admin")) {
      const unauthorized = ensureAdmin(request, env);
      if (unauthorized) return unauthorized;

      if (pathname === "/api/admin/links" && request.method === "GET") {
        return listLinks(url, env);
      }

      const idMatch = pathname.match(/\/api\/admin\/links\/(\d+)/);
      if (idMatch) {
        const id = Number(idMatch[1]);
        if (request.method === "PATCH") {
          return updateLink(request, env, id);
        }
        if (request.method === "DELETE") {
          return deleteLink(env, id);
        }
      }

      return json({ error: "Not found" }, { status: 404 });
    }

    if (request.method === "GET" && pathname.startsWith("/admin")) {
      return new Response(adminPage, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    const codeMatch = pathname.match(/^\/(\w{4,32})$/);
    if (request.method === "GET" && codeMatch) {
      return redirect(codeMatch[1], env);
    }

    if (pathname === "/" && request.method === "GET") {
      return new Response(landingPage, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return json({ error: "Not found" }, { status: 404 });
  },
};
