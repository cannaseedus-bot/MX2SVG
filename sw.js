'use strict';

/* ============================================================
   KUHUL SW KERNEL — SECTIONED FUNCTIONS (NUMBERED)
   manifest.json is server law; sw.js is the kernel executor.
   ============================================================ */

const KERNEL = Object.freeze({
  v: '1.0.0',
  name: 'kuhul.sw.kernel',
  fault_prefix: 'K'
});

const CACHE = 'mx2svg-pwa-v3';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './abr_engine.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(K100_route(event.request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const res = await fetch(event.request);
      if (event.request.method === 'GET' && res.ok) {
        const c = await caches.open(CACHE);
        c.put(event.request, res.clone());
      }
      return res;
    })());
  }
});

/* -------------------------
   K001 — boot + cache
-------------------------- */
async function K001_boot() {
  await caches.open(CACHE);
  return true;
}

/* -------------------------
   K010 — qwen.health
-------------------------- */
async function K010_qwen_health() {
  return json({ ok: true, provider: 'qwen' }, 200);
}

/* -------------------------
   K011 — qwen.infer (PRIMARY)
-------------------------- */
async function K011_qwen_infer(_req, ctx) {
  throw fault('K011', 'E_NOT_IMPL', 'qwen.infer adapter not wired yet', { contract: ctx.contract });
}

/* -------------------------
   K020 — lam.o.health (ADDON)
-------------------------- */
async function K020_lamo_health() {
  const r = await fetch('http://localhost:61683/api/tags');
  const data = await safeJson(r);
  return json({ ok: r.ok, provider: 'ollama', data }, r.ok ? 200 : 503);
}

/* -------------------------
   K021 — lam.o.infer (ADDON)
-------------------------- */
async function K021_lamo_infer(req) {
  const body = await readJson(req);
  if (!body || typeof body !== 'object') {
    throw fault('K021', 'E_CONTRACT', 'request body must be JSON object');
  }
  const model = body.model ? String(body.model) : null;
  const prompt = body.prompt != null ? String(body.prompt) : null;
  if (!model || !prompt) {
    throw fault('K021', 'E_CONTRACT', 'model and prompt are required');
  }

  const r = await fetch('http://localhost:61683/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  });
  const data = await safeJson(r);
  if (!r.ok) {
    throw fault('K021', 'E_UPSTREAM', 'ollama upstream error', { status: r.status, data });
  }
  return json({ ok: true, provider: 'ollama', data }, 200);
}

/* -------------------------
   K110 — fs.list
-------------------------- */
async function K110_fs_list() {
  throw fault('K110', 'E_NOT_IMPL', 'fs.list adapter not wired yet');
}

/* -------------------------
   K111 — fs.read
-------------------------- */
async function K111_fs_read() {
  throw fault('K111', 'E_NOT_IMPL', 'fs.read adapter not wired yet');
}

/* -------------------------
   K112 — fs.write
-------------------------- */
async function K112_fs_write() {
  throw fault('K112', 'E_NOT_IMPL', 'fs.write adapter not wired yet');
}

/* -------------------------
   K130 — cli.run
-------------------------- */
async function K130_cli_run() {
  throw fault('K130', 'E_NOT_IMPL', 'cli.run adapter not wired yet');
}

/* -------------------------
   K210 — ast.parse
-------------------------- */
async function K210_ast_parse() {
  throw fault('K210', 'E_NOT_IMPL', 'ast.parse adapter not wired yet');
}

/* ============================================================
   DISPATCH TABLE (NUMBERED)
   ============================================================ */

const HANDLERS = Object.freeze({
  K001: K001_boot,
  K010: K010_qwen_health,
  K011: K011_qwen_infer,
  K020: K020_lamo_health,
  K021: K021_lamo_infer,
  K110: K110_fs_list,
  K111: K111_fs_read,
  K112: K112_fs_write,
  K130: K130_cli_run,
  K210: K210_ast_parse
});

/* ============================================================
   K100 — route resolver (manifest.json is server law)
   ============================================================ */

async function K100_route(req) {
  try {
    const server = await K101_manifest_server();
    const pathname = new URL(req.url).pathname;
    const route = server.routes[pathname];
    if (!route) {
      return json({ ok: false, fault: 'K100:E_NO_ROUTE' }, 404);
    }

    if ((route.method || 'POST') !== req.method) {
      return json({ ok: false, fault: 'K100:E_METHOD' }, 405);
    }

    const ctx = { server, route, contract: route.contract || null };
    const fn = HANDLERS[route.handler];
    if (!fn) {
      return json({ ok: false, fault: `K100:E_NO_HANDLER:${route.handler}` }, 500);
    }

    return await fn(req, ctx);
  } catch (err) {
    const fe = normalizeFault(err, 'K100');
    return json(
      { ok: false, fault: fe.fault, message: fe.message, meta: fe.meta || null },
      fe.status || 500
    );
  }
}

/* -------------------------
   K101 — manifest loader
-------------------------- */
let __server_cache = null;
async function K101_manifest_server() {
  if (__server_cache) return __server_cache;
  const r = await fetch('/manifest.json', { cache: 'no-cache' });
  const m = await r.json();
  if (!m.kuhul_server) {
    throw fault('K101', 'E_NO_SERVER', 'manifest missing kuhul_server');
  }
  __server_cache = m.kuhul_server;
  return __server_cache;
}

/* ============================================================
   FAULT SYSTEM (sectioned)
   ============================================================ */

function fault(section, code, message, meta) {
  const e = new Error(message || code);
  e.__fault = `${section}:${code}`;
  e.__section = section;
  e.__code = code;
  e.__meta = meta || null;
  e.__status = 500;
  return e;
}

function normalizeFault(err, fallbackSection) {
  const section = err?.__section || fallbackSection;
  const code = err?.__code || 'E_UNKNOWN';
  return {
    fault: `${section}:${code}`,
    message: String(err?.message || code),
    meta: err?.__meta || null,
    status: err?.__status || 500
  };
}

/* ============================================================
   HELPERS
   ============================================================ */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

async function safeJson(r) {
  try {
    return await r.json();
  } catch {
    return { __raw: await r.text() };
  }
}

async function readJson(req) {
  const text = await req.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text };
  }
}

K001_boot();
