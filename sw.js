/* =====================================================================
   sw.js — MX2SVG + lam.o kernel adapter
   - Deterministic API-in / API-out for lam.o
   - Routes:
       POST  /api/lam.o/health
       POST  /api/lam.o/describe
       POST  /api/lam.o/infer      (XJSON contract)
       POST  /api/lam.o/session/export   (SCXQ2 stream export)
       POST  /api/lam.o/session/clear
   - Captures inference sessions as SCXQ2 frame streams (.scxq2stream)
   - Keeps MX2SVG model load + tokenize messaging intact.
   ===================================================================== */

'use strict';

const CACHE = 'mx2svg-pwa-v2';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './abr_engine.js'];

importScripts('./abr_engine.js');

let modelLoaded = false;
let transformers = null;

// ---- lam.o endpoints (from manifest) ----
const LAMO = {
  base: 'http://localhost:61683',
  // You can keep the manifest endpoint as a “logical” endpoint and map here:
  infer: '/api/generate',    // Ollama text/chat
  tags: '/api/tags',         // list models
  show: '/api/show',         // model info
  ps:   '/api/ps'            // running models
  // health = simple fetch to base or /api/tags
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
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

  // Only intercept same-origin API routes
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/lam.o/')) {
    event.respondWith(handleLamO(event.request));
    return;
  }

  // Cache-first for core shell
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const res = await fetch(event.request);
      // only cache GET
      if (event.request.method === 'GET' && res.ok) {
        const c = await caches.open(CACHE);
        c.put(event.request, res.clone());
      }
      return res;
    })());
  }
});

async function ensureTransformers() {
  if (transformers) {
    return transformers;
  }
  importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/transformers.min.js');
  transformers = self.transformers;
  return transformers;
}

async function handleLoadModel(weights) {
  await ensureTransformers();
  modelLoaded = Boolean(weights);
  return `Model load requested: ${weights}`;
}

async function handleTokenize(text) {
  if (!modelLoaded) {
    return { error: 'Model not loaded. Provide model.safetensors before tokenization.' };
  }
  await ensureTransformers();
  return {
    input: text,
    note: 'Tokenizer integration pending model weights and runtime configuration.'
  };
}

function broadcast(message) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (!type) {
    return;
  }

  if (type === 'LOAD_MODEL') {
    handleLoadModel(payload?.weights).then((message) => {
      broadcast({ type: 'status', payload: message });
    });
    return;
  }

  if (type === 'TOKENIZE') {
    handleTokenize(payload?.text ?? '').then((result) => {
      broadcast({ type: 'tokenization', payload: result });
    });
  }
});

/* =====================================================================
   SCXQ2 STREAM CAPTURE (minimal, deterministic)
   Frame kinds:
     1 HDR, 2 TICK, 3 REQ, 4 RES, 5 ERR, 6 END
   Notes:
   - This is a *canonical* binary stream envelope.
   - It is NOT compression-heavy; it is frame-faithful.
   - Plug your full SCXQ2 lane packer later without changing ABI.
   ===================================================================== */

const FRAME = Object.freeze({ HDR:1, TICK:2, REQ:3, RES:4, ERR:5, END:6 });

/** In-memory session streams keyed by session_id (also mirrored into IDB) */
const SESSION = {
  // session_id -> { frames: Uint8Array[], started_ms: number, last_tick: number }
  map: new Map()
};

/** Very small deterministic hash (FNV-1a 32-bit) */
function fnv1a32(str) {
  const s = String(str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24))) >>> 0;
  }
  return h >>> 0;
}
function hex8(u32){ return u32.toString(16).padStart(8,'0'); }

/** Stable JSON stringify */
function stableStringify(value) {
  const seen = new Set();
  const walk = (v) => {
    if (v === null) return 'null';
    const t = typeof v;
    if (t === 'number') return Number.isFinite(v) ? String(v) : '0';
    if (t === 'boolean') return v ? 'true' : 'false';
    if (t === 'string') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(walk).join(',') + ']';
    if (t === 'object') {
      if (seen.has(v)) return '"[circular]"';
      seen.add(v);
      const keys = Object.keys(v).sort();
      const body = keys.map(k => JSON.stringify(k)+':'+walk(v[k])).join(',');
      seen.delete(v);
      return '{' + body + '}';
    }
    return '""';
  };
  return walk(value);
}

/** Frame encoder: [kind:u8][tick:u32le][len:u32le][payload:bytes] */
function encFrame(kind, tick, payloadBytes) {
  const len = payloadBytes ? payloadBytes.byteLength : 0;
  const out = new Uint8Array(1 + 4 + 4 + len);
  out[0] = kind & 0xff;
  const dv = new DataView(out.buffer);
  dv.setUint32(1, tick >>> 0, true);
  dv.setUint32(5, len >>> 0, true);
  if (len) out.set(new Uint8Array(payloadBytes), 9);
  return out;
}

function utf8(s){ return new TextEncoder().encode(String(s)); }

/** Ensure session exists */
function ensureSession(session_id) {
  const id = String(session_id || 'session_default');
  let s = SESSION.map.get(id);
  if (!s) {
    s = { frames: [], started_ms: Date.now(), last_tick: 0 };
    // HDR frame
    const hdr = {
      '@type': 'scxq2.stream.hdr.v1',
      magic: 'SCX2',
      stream: 'lam.o.infer',
      policy: 'xjson://contract/lam.o.infer/v1',
      created_ms: s.started_ms
    };
    s.frames.push(encFrame(FRAME.HDR, 0, utf8(stableStringify(hdr))));
    SESSION.map.set(id, s);
  }
  return s;
}

function pushFrame(session_id, kind, tick, obj) {
  const s = ensureSession(session_id);
  const t = (tick >>> 0);
  s.last_tick = Math.max(s.last_tick, t);
  const payload = obj == null ? '' : stableStringify(obj);
  s.frames.push(encFrame(kind, t, utf8(payload)));
}

/** Export stream bytes: concatenation of frames */
function exportStream(session_id) {
  const s = ensureSession(session_id);
  const total = s.frames.reduce((a,b)=>a+b.byteLength,0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const f of s.frames) { out.set(f, off); off += f.byteLength; }
  return out;
}

function clearSession(session_id) {
  SESSION.map.delete(String(session_id || 'session_default'));
}

/* =====================================================================
   XJSON CONTRACT — lam.o.infer (v1)
   Deterministic, API-in/API-out. No UI, no model hardcoding.
   ===================================================================== */

const LAMO_INFER_CONTRACT = Object.freeze({
  '@id': 'xjson://contract/lam.o.infer/v1',
  '@type': 'xjson.contract',
  '@name': 'lam.o.infer',
  '@mode': 'api_in_api_out',
  '@transport': 'ollama_http_v1',
  '@rules': {
    // invariants
    no_async_semantics: true,
    no_side_effects_outside_stream: true,
    deterministic_hashing: 'fnv1a32'
  },
  '@input.schema': {
    '@type': 'lam.o.infer.request.v1',
    // model is required but caller decides what
    model: 'string',
    // one of: chat|reasoning|analysis|image_gen (you listed)
    mode: 'string',
    // unified prompt/messages
    prompt: 'string?',
    messages: 'array?',
    // generation controls
    options: 'object?',
    stream: 'boolean?',
    // session capture
    session_id: 'string?',
    tick: 'u32?'
  },
  '@output.schema': {
    '@type': 'lam.o.infer.response.v1',
    ok: 'boolean',
    model: 'string',
    mode: 'string',
    created_ms: 'u64',
    // response payload mirrors Ollama generate/chat output (normalized)
    data: 'object?',
    error: 'object?',
    // stream proof anchors
    session_id: 'string?',
    req_hash: 'h:hex8?',
    res_hash: 'h:hex8?'
  }
});

/* =====================================================================
   ROUTER
   ===================================================================== */

async function handleLamO(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  try {
    if (req.method !== 'POST') return json({ ok:false, error:{ code:'METHOD', message:'POST only' } }, 405);

    if (path === '/api/lam.o/health') return await lamHealth(req);
    if (path === '/api/lam.o/describe') return await lamDescribe(req);
    if (path === '/api/lam.o/infer') return await lamInfer(req);

    if (path === '/api/lam.o/session/export') return await sessionExport(req);
    if (path === '/api/lam.o/session/clear') return await sessionClear(req);

    return json({ ok:false, error:{ code:'NOT_FOUND', message:'Unknown lam.o route' } }, 404);
  } catch (err) {
    return json({ ok:false, error:{ code:'SW_ERR', message:String(err?.message||err), detail:String(err?.stack||'') } }, 500);
  }
}

function json(obj, status=200, headers={}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type':'application/json', ...headers }
  });
}

async function readJson(req) {
  const txt = await req.text();
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return { __raw: txt }; }
}

/* =====================================================================
   lam.o.health
   ===================================================================== */

async function lamHealth(_req) {
  // simplest reliable: hit /api/tags
  const r = await fetch(LAMO.base + LAMO.tags, { method:'GET' });
  const ok = r.ok;
  let data = null;
  try { data = await r.json(); } catch { data = null; }
  return json({
    ok,
    server: LAMO.base,
    protocol: 'ollama_http_v1',
    tags: data || null
  }, ok ? 200 : 503);
}

/* =====================================================================
   lam.o.describe
   body: { model?: string }
   - if model omitted -> list tags
   - else -> /api/show
   ===================================================================== */

async function lamDescribe(req) {
  const body = await readJson(req) || {};
  const model = body.model ? String(body.model) : null;

  if (!model) {
    const r = await fetch(LAMO.base + LAMO.tags, { method:'GET' });
    const data = await safeJson(r);
    return json({ ok: r.ok, data }, r.ok ? 200 : 502);
  }

  const r = await fetch(LAMO.base + LAMO.show, {
    method:'POST',
    headers: { 'content-type':'application/json' },
    body: JSON.stringify({ name: model })
  });
  const data = await safeJson(r);
  return json({ ok: r.ok, model, data }, r.ok ? 200 : 502);
}

async function safeJson(r) {
  try { return await r.json(); } catch { return { __raw: await r.text() }; }
}

/* =====================================================================
   lam.o.infer
   Input must satisfy contract. Produces:
   - req_hash/res_hash
   - SCXQ2 stream frames: REQ / RES / ERR (+ END optional)
   ===================================================================== */

async function lamInfer(req) {
  const body = await readJson(req) || {};
  const v = validateLamInfer(body);
  if (!v.ok) {
    // stream capture (error)
    const session_id = String(body.session_id || 'session_default');
    const tick = (body.tick >>> 0) || 0;
    pushFrame(session_id, FRAME.ERR, tick, { code:'CONTRACT', errors: v.errors });
    return json({ ok:false, error:{ code:'CONTRACT', errors: v.errors }, contract: LAMO_INFER_CONTRACT['@id'] }, 400);
  }

  const session_id = String(body.session_id || 'session_default');
  const tick = (body.tick >>> 0) || 0;

  // Build normalized request envelope (deterministic)
  const reqEnv = {
    '@type': 'lam.o.infer.request.v1',
    model: String(body.model),
    mode: String(body.mode),
    stream: !!body.stream,
    prompt: body.prompt != null ? String(body.prompt) : null,
    messages: Array.isArray(body.messages) ? body.messages : null,
    options: (body.options && typeof body.options === 'object') ? body.options : null
  };

  const reqCanon = stableStringify(reqEnv);
  const req_hash = 'h:' + hex8(fnv1a32(reqCanon));

  pushFrame(session_id, FRAME.REQ, tick, { req_hash, req: reqEnv });

  // Map mode -> ollama API shape
  const ollamaPayload = toOllamaPayload(reqEnv);

  // If stream requested, we still return one normalized response object,
  // but we also capture the stream chunks as RES frames (chunked text).
  const created_ms = Date.now();

  if (reqEnv.stream) {
    const r = await fetch(LAMO.base + LAMO.infer, {
      method:'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({ ...ollamaPayload, stream: true })
    });

    if (!r.ok || !r.body) {
      const errText = await r.text().catch(()=> '');
      pushFrame(session_id, FRAME.ERR, tick, { code:'UPSTREAM', status:r.status, body: errText });
      return json({
        ok:false,
        model:reqEnv.model,
        mode:reqEnv.mode,
        created_ms,
        session_id,
        req_hash,
        error:{ code:'UPSTREAM', status:r.status, body: errText }
      }, 502);
    }

    // Read NDJSON stream deterministically (text chunks)
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let finalObj = null;
    let chunkCount = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream:true });

      // split lines
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;

        let obj = null;
        try { obj = JSON.parse(line); } catch { obj = { __raw: line }; }
        chunkCount++;

        // capture chunk
        pushFrame(session_id, FRAME.RES, tick, { kind:'chunk', i:chunkCount, data: obj });

        // keep last full object as “final”
        finalObj = obj;
      }
    }

    // Normalize final response
    const resEnv = {
      '@type': 'lam.o.infer.response.v1',
      ok: true,
      model: reqEnv.model,
      mode: reqEnv.mode,
      created_ms,
      data: {
        upstream: 'ollama',
        stream: true,
        chunks: chunkCount,
        final: finalObj
      }
    };

    const resCanon = stableStringify(resEnv);
    const res_hash = 'h:' + hex8(fnv1a32(resCanon));

    pushFrame(session_id, FRAME.TICK, tick, { req_hash, res_hash, done:true });
    // optional END per request (not closing entire session)
    // pushFrame(session_id, FRAME.END, tick, { reason:'infer_done' });

    return json({
      ok:true,
      model:reqEnv.model,
      mode:reqEnv.mode,
      created_ms,
      data: resEnv.data,
      session_id,
      req_hash,
      res_hash
    }, 200);
  }

  // Non-stream call
  const r = await fetch(LAMO.base + LAMO.infer, {
    method:'POST',
    headers: { 'content-type':'application/json' },
    body: JSON.stringify({ ...ollamaPayload, stream: false })
  });

  const upstream = await safeJson(r);
  if (!r.ok) {
    pushFrame(session_id, FRAME.ERR, tick, { code:'UPSTREAM', status:r.status, data: upstream });
    return json({
      ok:false,
      model:reqEnv.model,
      mode:reqEnv.mode,
      created_ms,
      session_id,
      req_hash,
      error:{ code:'UPSTREAM', status:r.status, data: upstream }
    }, 502);
  }

  const resEnv = {
    '@type': 'lam.o.infer.response.v1',
    ok: true,
    model: reqEnv.model,
    mode: reqEnv.mode,
    created_ms,
    data: normalizeOllama(upstream)
  };

  const resCanon = stableStringify(resEnv);
  const res_hash = 'h:' + hex8(fnv1a32(resCanon));

  pushFrame(session_id, FRAME.RES, tick, { res_hash, res: resEnv });
  pushFrame(session_id, FRAME.TICK, tick, { req_hash, res_hash, done:true });

  return json({
    ok:true,
    model:reqEnv.model,
    mode:reqEnv.mode,
    created_ms,
    data: resEnv.data,
    session_id,
    req_hash,
    res_hash
  }, 200);
}

function validateLamInfer(x) {
  const errors = [];
  if (!x || typeof x !== 'object') errors.push('body must be object');
  if (!x.model || typeof x.model !== 'string') errors.push('model:string required');
  if (!x.mode || typeof x.mode !== 'string') errors.push('mode:string required');

  // Either prompt or messages
  const hasPrompt = x.prompt != null && String(x.prompt).length > 0;
  const hasMessages = Array.isArray(x.messages) && x.messages.length > 0;
  if (!hasPrompt && !hasMessages) errors.push('prompt or messages required');

  // options if present must be object
  if (x.options != null && (typeof x.options !== 'object' || Array.isArray(x.options)))
    errors.push('options must be object');

  // stream if present must be boolean
  if (x.stream != null && typeof x.stream !== 'boolean') errors.push('stream must be boolean');

  // tick if present must be finite number
  if (x.tick != null && !Number.isFinite(+x.tick)) errors.push('tick must be number');

  return { ok: errors.length === 0, errors };
}

function toOllamaPayload(reqEnv) {
  // If messages -> treat as chat-like but still via /api/generate unless you swap to /api/chat later.
  // Ollama supports /api/generate; many people use it for prompt.
  // You can later extend transport without changing the contract.
  if (reqEnv.messages) {
    // Minimal deterministic lowering: join into a single prompt
    const joined = reqEnv.messages.map(m => {
      const role = m.role ? String(m.role) : 'user';
      const content = m.content != null ? String(m.content) : '';
      return role.toUpperCase() + ': ' + content;
    }).join('\n') + '\nASSISTANT:';
    return { model: reqEnv.model, prompt: joined, options: reqEnv.options || {} };
  }
  return { model: reqEnv.model, prompt: reqEnv.prompt || '', options: reqEnv.options || {} };
}

function normalizeOllama(upstream) {
  // Keep it thin & stable
  // Ollama generate returns {response, done, ...}
  if (!upstream || typeof upstream !== 'object') return { raw: upstream };
  const out = {
    response: upstream.response ?? null,
    done: upstream.done ?? null,
    total_duration: upstream.total_duration ?? null,
    load_duration: upstream.load_duration ?? null,
    prompt_eval_count: upstream.prompt_eval_count ?? null,
    eval_count: upstream.eval_count ?? null
  };
  return out;
}

/* =====================================================================
   Session export / clear
   ===================================================================== */

async function sessionExport(req) {
  const body = await readJson(req) || {};
  const session_id = String(body.session_id || 'session_default');
  const bytes = exportStream(session_id);
  // Provide deterministic metadata
  const meta = {
    '@type': 'scxq2.stream.export.v1',
    session_id,
    bytes: bytes.byteLength,
    hash: 'h:' + hex8(fnv1a32(String.fromCharCode(...bytes.slice(0, Math.min(2048, bytes.length))))) // header-sample hash
  };
  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'x-scxq2-meta': JSON.stringify(meta)
    }
  });
}

async function sessionClear(req) {
  const body = await readJson(req) || {};
  const session_id = String(body.session_id || 'session_default');
  clearSession(session_id);
  return json({ ok:true, session_id }, 200);
}

/* =====================================================================
   RUNNER PACK TEMPLATE (drop-in JSON as code comment)
   ===================================================================== */

/*
XJSON — Runner Pack Template (lam.o)
{
  "@type": "kuhul.runner_pack.v1",
  "@id": "pack_lam_o",
  "name": "Ollama Model Runner Pack",
  "role": "model_runner_backend",
  "fold": "AI",
  "protocol": "ollama_http_v1",
  "routes": {
    "health":   { "method":"POST", "path":"/api/lam.o/health" },
    "describe": { "method":"POST", "path":"/api/lam.o/describe" },
    "infer":    { "method":"POST", "path":"/api/lam.o/infer", "contract":"xjson://contract/lam.o.infer/v1" },
    "export":   { "method":"POST", "path":"/api/lam.o/session/export" },
    "clear":    { "method":"POST", "path":"/api/lam.o/session/clear" }
  },
  "contracts": {
    "lam.o.infer": "xjson://contract/lam.o.infer/v1"
  },
  "stream": {
    "format": "scxq2.stream.v1",
    "frame_kinds": { "HDR":1,"TICK":2,"REQ":3,"RES":4,"ERR":5,"END":6 }
  }
}
*/

/* =====================================================================
   ALSO EMITTED: XJSON contract object as a global for importers
   ===================================================================== */
self.LAMO_INFER_CONTRACT = LAMO_INFER_CONTRACT;
