/* ============================================================
   MX2SVG — SW.KERNEL (K### SECTIONS)
   - manifest.json hosts kuhol_server routes/contracts/policies
   - sw.js is numbered + fault-addressable
   - Qwen = primary brain, lam.o = addon
   - SCXQ2 stream capture = kernel service for ALL routes + channels
   ============================================================ */

'use strict';

/* =========================
   K000 — GLOBALS
   ========================= */

const K = Object.create(null);
const STATE = {
  server: null,
  policy: null,
  streams: Object.create(null),   // stream_id -> SCXQ2Stream
  session: {
    id: 'sess_' + String(Date.now()),
    tick: 0
  },
  models: {
    qwen: { status: 'unknown' },
    lamo: { status: 'unknown' }
  }
};

/* =========================
   K001 — BOOT
   ========================= */
K.K001 = async () => true;

/* =========================
   K010 — MANIFEST LOAD
   ========================= */
K.K010 = async () => {
  if (STATE.server) return STATE.server;
  const r = await fetch('./manifest.json', { cache: 'no-cache' });
  const m = await r.json();
  if (!m.kuhul_server) throw fault('K010', 'E_NO_KUHUL_SERVER');
  STATE.server = m.kuhul_server;
  STATE.policy = m.kuhul_server.policies || {};
  return STATE.server;
};

/* =========================
   K011 — CONTRACT GET
   ========================= */
K.K011 = async (contractId) => {
  const server = await K.K010();
  const c = server.contracts && server.contracts[contractId];
  if (!c) throw fault('K011', 'E_NO_CONTRACT:' + contractId);
  return c;
};

/* =========================
   K012 — CONTRACT CHECK (MINIMAL)
   - deterministic, shallow, no JSON schema engine
   ========================= */
K.K012 = async (contractId, body, dir /* 'input'|'output' */) => {
  const c = await K.K011(contractId);
  const shape = c && c[dir];
  if (!shape) return true;
  // minimal: required fields are those not ending with '?'
  for (const k of Object.keys(shape)) {
    const t = shape[k];
    if (typeof t === 'string' && t.endsWith('?')) continue;
    if (Array.isArray(t)) continue; // enum list
    if (!(k in body)) throw fault('K012', `E_CONTRACT_${dir.toUpperCase()}_MISSING:${k}`);
  }
  return true;
};

/* =========================
   K020 — QWEN HEALTH
   ========================= */
K.K020 = async () => {
  // Qwen is "primary brain"; actual adapter is project-specific.
  // Keep deterministic stub + stream capture.
  SCXQ2.capture('route.qwen.health', { ok: true });
  STATE.models.qwen.status = 'live';
  return json({ ok: true, provider: 'qwen', status: STATE.models.qwen.status });
};

/* =========================
   K021 — QWEN INFER
   - contract: xjson://contract/qwen.infer/v1
   ========================= */
K.K021 = async (req) => {
  const body = await req.json();
  await K.K012('xjson://contract/qwen.infer/v1', body, 'input');

  const stream = SCXQ2.beginSession({
    kind: 'infer',
    provider: 'qwen',
    session_id: STATE.session.id,
    route: '/api/qwen/infer'
  });

  SCXQ2.capture('infer.start', { provider: 'qwen', body });

  // TODO: wire to real Qwen runtime (Transformers.js / WebGPU / local)
  const out = {
    text: '[QWEN OUTPUT — adapter not wired]',
    tokens_used: 0
  };

  SCXQ2.capture('infer.end', { provider: 'qwen', out });
  const frame = SCXQ2.endSession(stream, { ok: true });

  await K.K012('xjson://contract/qwen.infer/v1', out, 'output');
  return json({ ...out, scxq2: { stream_id: stream.id, end_hash: frame.end_hash } });
};

/* =========================
   K030 — LAM.O HEALTH
   ========================= */
K.K030 = async () => {
  SCXQ2.capture('route.lamo.health', { target: 'http://localhost:61683' });
  try {
    const r = await fetch('http://localhost:61683/api/tags', { method: 'GET' });
    const j = await r.json();
    STATE.models.lamo.status = r.ok ? 'live' : 'down';
    return json({ ok: r.ok, provider: 'ollama', status: STATE.models.lamo.status, tags: j }, r.ok ? 200 : 503);
  } catch (e) {
    STATE.models.lamo.status = 'down';
    return json({ ok: false, provider: 'ollama', status: 'down', fault: 'CONNECT_FAIL' }, 503);
  }
};

/* =========================
   K031 — LAM.O INFER
   - contract: xjson://contract/lam.o.infer/v1
   ========================= */
K.K031 = async (req) => {
  const body = await req.json();
  await K.K012('xjson://contract/lam.o.infer/v1', body, 'input');

  const stream = SCXQ2.beginSession({
    kind: 'infer',
    provider: 'ollama',
    session_id: STATE.session.id,
    route: '/api/lam.o/infer'
  });

  SCXQ2.capture('infer.start', { provider: 'ollama', body });

  let out;
  try {
    const r = await fetch('http://localhost:61683/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    out = await r.json();
    SCXQ2.capture('infer.end', { provider: 'ollama', out, ok: r.ok });
  } catch (e) {
    out = { response: '', fault: 'CONNECT_FAIL' };
    SCXQ2.capture('infer.end', { provider: 'ollama', out, ok: false });
  }

  const frame = SCXQ2.endSession(stream, { ok: !out.fault });

  // contract output is minimal ("response"); allow passthrough but ensure presence
  if (!('response' in out)) out.response = (out && (out.response || out.output || out.message || '')) + '';
  await K.K012('xjson://contract/lam.o.infer/v1', out, 'output');

  return json({ ...out, scxq2: { stream_id: stream.id, end_hash: frame.end_hash } }, out.fault ? 503 : 200);
};

/* =========================
   K032 — LAM.O DESCRIBE (OPTIONAL)
   - uses /api/show in Ollama if available, else tags
   ========================= */
K.K032 = async (req) => {
  const body = await req.json().catch(() => ({}));
  const model = String(body.model || '');
  SCXQ2.capture('route.lamo.describe', { model });

  try {
    // common endpoint for details in some ollama builds
    const r = await fetch('http://localhost:61683/api/show', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: model })
    });
    const j = await r.json();
    return json({ ok: r.ok, model, describe: j }, r.ok ? 200 : 500);
  } catch (e) {
    return json({ ok: false, model, fault: 'CONNECT_FAIL' }, 503);
  }
};

/* =========================
   K040 — SESSION EXPORT
   ========================= */
K.K040 = async () => {
  const bundle = {
    '@type': 'mx2svg.session.export.v1',
    session_id: STATE.session.id,
    tick: STATE.session.tick,
    streams: SCXQ2.exportAll()
  };
  SCXQ2.capture('session.export', { session_id: STATE.session.id, streams: Object.keys(STATE.streams).length });
  return json(bundle);
};

/* =========================
   K041 — SESSION CLEAR
   ========================= */
K.K041 = async () => {
  SCXQ2.capture('session.clear', { session_id: STATE.session.id });
  SCXQ2.resetAll();
  STATE.session.id = 'sess_' + String(Date.now());
  STATE.session.tick = 0;
  return json({ ok: true, session_id: STATE.session.id });
};

/* =========================
   K070 — POSTMESSAGE CHANNEL (INSTRUCTION_CHANNELS)
   - sw_kernel expects: LOAD_MODEL, TOKENIZE, LAMO_ROUTE
   ========================= */
K.K070 = async (msg, src) => {
  const { type, payload } = msg || {};
  if (!type) return;

  // capture all channel traffic
  SCXQ2.capture('channel.sw_kernel', { type, payload });

  if (type === 'LOAD_MODEL') {
    // placeholder: wire to actual runtime loader
    return reply(src, { status: 'ok', model: payload && payload.model || 'qwen' });
  }

  if (type === 'TOKENIZE') {
    // deterministic stub: return empty token arrays
    const tokenization = { svg_tokens: [], json_tokens: [] };
    return reply(src, { status: 'ok', tokenization });
  }

  if (type === 'LAMO_ROUTE') {
    // allow UI to request a lam.o REST path via message
    const path = String(payload && payload.path || '/api/lam.o/health');
    const body = payload && payload.body ? payload.body : {};
    const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return reply(src, { status: r.ok ? 'ok' : 'fail', lamo_response: j });
  }

  return reply(src, { status: 'fail', fault: 'E_UNKNOWN_INSTRUCTION' });
};

/* =========================
   K100 — ROUTER (MANIFEST ROUTES)
   ========================= */
K.K100 = async (req) => {
  const server = await K.K010();
  const url = new URL(req.url);
  const route = server.routes[url.pathname];
  if (!route) return json({ ok: false, fault: 'K100:E_NO_ROUTE', path: url.pathname }, 404);

  if (String(req.method).toUpperCase() !== String(route.method).toUpperCase()) {
    return json({ ok: false, fault: 'K100:E_BAD_METHOD', want: route.method, got: req.method }, 405);
  }

  const handler = K[route.handler];
  if (!handler) return json({ ok: false, fault: 'K100:E_NO_HANDLER', handler: route.handler }, 500);

  // universal capture
  SCXQ2.capture('route.call', { path: url.pathname, handler: route.handler, cap: route.cap || null });

  // contract check (input) if declared
  if (route.contract) {
    const body = await req.clone().json().catch(() => null);
    if (body) await K.K012(route.contract, body, 'input');
  }

  const res = await handler(req);

  // capture response status only (no body read here; handler captures specifics)
  SCXQ2.capture('route.ret', { path: url.pathname, status: res.status });

  return res;
};

/* =========================
   K900 — FETCH HOOK
   ========================= */
self.addEventListener('fetch', (e) => {
  const p = new URL(e.request.url).pathname;
  if (p.startsWith('/api/')) e.respondWith(K.K100(e.request));
});

/* =========================
   K910 — MESSAGE HOOK
   ========================= */
self.addEventListener('message', (e) => {
  // accept messages from any controlled client in-scope
  e.waitUntil(K.K070(e.data, e.source));
});

/* ============================================================
   SCXQ2 — STREAM CAPTURE SERVICE (KERNEL-WIDE)
   - no crypto, deterministic hashing, replay-safe
   - stream frames used by ALL routes + channels
   ============================================================ */

const SCXQ2 = (() => {
  // Frame kinds (canonical-ish)
  const KIND = Object.freeze({
    HDR: 1, TICK: 2, MASK: 3, EVT: 4, END: 7
  });

  function fnv1a_u32(str) {
    const s = String(str);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function hashHex(obj) {
    const h = fnv1a_u32(stableStringify(obj));
    return 'h:' + h.toString(16).padStart(8, '0');
  }

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
        const body = keys.map(k => JSON.stringify(k) + ':' + walk(v[k])).join(',');
        seen.delete(v);
        return '{' + body + '}';
      }
      return '""';
    };
    return walk(value);
  }

  function newStream(meta) {
    const id = 'st_' + String(Date.now()) + '_' + String((Math.random() * 1e9) | 0); // NOTE: can be replaced if you require strict "no randomness"
    // If you want absolutely zero randomness: replace suffix with STATE.session.tick and a counter.
    const frames = [];
    const hdr = {
      k: KIND.HDR,
      t: Date.now(),
      meta: meta || {},
      v: 1
    };
    frames.push(hdr);
    return { id, frames, open: true, end_hash: 'h:00000000' };
  }

  // deterministic id fallback (no randomness) – used if you flip STRICT_ID
  const STRICT_ID = true;
  let _ctr = 0;

  function beginSession(meta) {
    const sid = STRICT_ID
      ? ('st_' + STATE.session.id + '_' + String(STATE.session.tick) + '_' + String((_ctr++) >>> 0))
      : undefined;

    const s = newStream(meta);
    if (sid) s.id = sid;

    STATE.streams[s.id] = s;
    capture('stream.begin', { stream_id: s.id, meta });
    return s;
  }

  function endSession(stream, metaEnd) {
    if (!stream || !STATE.streams[stream.id]) return { end_hash: 'h:00000000' };
    const s = STATE.streams[stream.id];
    if (!s.open) return s;

    const end = {
      k: KIND.END,
      t: Date.now(),
      meta: metaEnd || {}
    };
    s.frames.push(end);
    s.end_hash = hashHex(s.frames);
    s.open = false;

    capture('stream.end', { stream_id: s.id, end_hash: s.end_hash });
    return { end_hash: s.end_hash };
  }

  function capture(kind, payload) {
    const evt = {
      k: KIND.EVT,
      t: Date.now(),
      kind: String(kind),
      payload: payload === undefined ? null : payload
    };

    // append to all open streams (session-level capture)
    for (const id of Object.keys(STATE.streams)) {
      const s = STATE.streams[id];
      if (s && s.open) s.frames.push(evt);
    }
  }

  function exportAll() {
    const out = {};
    for (const id of Object.keys(STATE.streams)) {
      const s = STATE.streams[id];
      out[id] = {
        id,
        open: !!s.open,
        end_hash: s.end_hash,
        frames: s.frames.slice()
      };
    }
    return out;
  }

  function resetAll() {
    for (const k of Object.keys(STATE.streams)) delete STATE.streams[k];
    _ctr = 0;
  }

  return Object.freeze({
    beginSession,
    endSession,
    capture,
    exportAll,
    resetAll,
    _hashHex: hashHex,
    _stableStringify: stableStringify
  });
})();

/* ============================================================
   HELPERS
   ============================================================ */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function fault(section, code) {
  const e = new Error(section + ':' + code);
  e.section = section;
  e.code = code;
  return e;
}

async function reply(source, msg) {
  try {
    if (!source || !source.postMessage) return;
    source.postMessage(msg);
  } catch (_) {}
}
