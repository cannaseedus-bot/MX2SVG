// ULTRA NEURAL GEOMETRY STACK — ΩOS TRINITY SERVICE WORKER
// K'uhul + KLH + XJSON + SCXQ2 + SVG Brain Store (no DOM here)

// ----------------------------------------------------------
// CORE CONSTANTS
// ----------------------------------------------------------
const KUHUL_OS = 'kuhul-ultra-neuro-v1';
const KERNEL_CACHE = `${KUHUL_OS}-kernel`;
const STATIC_CACHE = `${KUHUL_OS}-static`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// ----------------------------------------------------------
// LIGHTWEIGHT KERNEL (K) — PROCESS TABLE
// ----------------------------------------------------------
const K = {
  p: new Map(),   // processes
  w: new Map(),   // weights / brains / registry

  async run(id, code, ctx = {}) {
    const proc = { id, code, ctx, st: 'run', ts: Date.now() };
    this.p.set(id, proc);
    // In this SW edition we don't execute glyphs fully;
    // we just register process + return context.
    return { id, res: 'ok', ctx };
  },

  status() {
    return {
      processes: this.p.size,
      registry: this.w.size,
      ts: Date.now()
    };
  }
};

// ----------------------------------------------------------
// SCXQ2 PATH CODEC (ULTRA-LITE)
// ----------------------------------------------------------
const SCXQ2 = {
  encodePath(pathData) {
    return pathData
      .replace(/M /g, '⟁M⟁')
      .replace(/L /g, '⟁L⟁')
      .replace(/C /g, '⟁C⟁')
      .replace(/Z/g, '⟁Z⟁')
      .replace(/,/g, '⟁')
      .replace(/\s+/g, '⟁');
  },
  decodePath(comp) {
    return comp
      .replace(/⟁M⟁/g, 'M ')
      .replace(/⟁L⟁/g, 'L ')
      .replace(/⟁C⟁/g, 'C ')
      .replace(/⟁Z⟁/g, 'Z')
      .replace(/⟁/g, ' ');
  }
};

// ----------------------------------------------------------
// BRAIN STORE — SCXQ2 PACKED SVG GEOMETRY
// ----------------------------------------------------------
const BrainStore = {
  brains: new Map(),   // brainId -> { meta, layers }

  initDemoBrains() {
    if (this.brains.size) return;

    // DEMO BRAIN #1 — "mx2lm_core" geometry (synthetic)
    const b1 = {
      id: 'mx2lm_core_svg',
      model: 'MX2LM-CORE-GEOMETRY',
      type: 'svg_qlora_scxq2',
      created: Date.now(),
      layers: [
        {
          name: 'lora_A',
          filter: null,
          paths: [
            {
              d: SCXQ2.encodePath(
                'M 0,10 C 20,5 40,15 60,10 C 80,5 100,15 120,10'
              ),
              stroke: 'rgb(255,0,80)',
              width: 1.5
            },
            {
              d: SCXQ2.encodePath(
                'M 0,20 C 20,25 40,15 60,20 C 80,25 100,15 120,20'
              ),
              stroke: 'rgb(80,160,255)',
              width: 1.2
            }
          ]
        },
        {
          name: 'lora_B',
          filter: null,
          paths: [
            {
              d: SCXQ2.encodePath(
                'M 0,40 C 30,60 60,20 90,40 C 120,60 150,20 180,40'
              ),
              stroke: 'rgb(255,160,0)',
              width: 1.8
            }
          ]
        }
      ]
    };

    // DEMO BRAIN #2 — "arena_brain" geometry (synthetic)
    const b2 = {
      id: 'arena_brain_svg',
      model: 'ARENA-BATTLE-BRAIN',
      type: 'svg_qlora_scxq2',
      created: Date.now(),
      layers: [
        {
          name: 'risk_map',
          filter: null,
          paths: [
            {
              d: SCXQ2.encodePath(
                'M 10,80 L 40,60 L 70,90 L 100,70 L 130,100'
              ),
              stroke: 'rgb(22,242,170)',
              width: 2.0
            }
          ]
        }
      ]
    };

    this.brains.set(b1.id, b1);
    this.brains.set(b2.id, b2);

    // Also mirror into kernel registry
    K.w.set(b1.id, b1);
    K.w.set(b2.id, b2);
  },

  list() {
    return Array.from(this.brains.values()).map(b => ({
      id: b.id,
      model: b.model,
      type: b.type,
      created: b.created
    }));
  },

  get(id) {
    const b = this.brains.get(id);
    if (!b) return null;

    // decode paths on the way out
    return {
      id: b.id,
      model: b.model,
      type: b.type,
      created: b.created,
      layers: b.layers.map(layer => ({
        name: layer.name,
        filter: layer.filter,
        paths: layer.paths.map(p => ({
          d: SCXQ2.decodePath(p.d),
          stroke: p.stroke,
          width: p.width
        }))
      }))
    };
  },

  // hook for future: pack raw weights from /usr into SCXQ2 geometry
  async packFromWeights(id, weightsMeta = {}) {
    // placeholder pipeline: in real mode this would map QLoRA -> SVG -> SCXQ2
    const synthetic = {
      id,
      model: weightsMeta.model || 'CUSTOM-GEOMETRY',
      type: 'svg_qlora_scxq2',
      created: Date.now(),
      layers: [
        {
          name: 'custom_layer',
          filter: null,
          paths: [
            {
              d: SCXQ2.encodePath('M 0,0 C 30,30 60,-10 90,10'),
              stroke: 'rgb(180,80,255)',
              width: 1.4
            }
          ]
        }
      ]
    };
    this.brains.set(id, synthetic);
    K.w.set(id, synthetic);
    return synthetic;
  }
};

// ----------------------------------------------------------
// ΩOS MANIFEST (KERNEL VIEW)
// ----------------------------------------------------------
const ΩMANIFEST_KERNEL = {
  Ωv: '2.1',
  n: 'ASX-PRIME-TRINITY-OS',
  d: 'Browser OS + Neural Geometry Kernel',
  brain_protocol: {
    format: 'svg_qlora_scxq2',
    slots: 16,
    engine: 'kuhul_geometry',
    registry: 'sw_brain_store'
  }
};

// ----------------------------------------------------------
// ΩOS API ROUTER
// ----------------------------------------------------------
async function respondΩOS(requestUrl, request) {
  const path = requestUrl.pathname.replace(/^\/api\/ΩOS\//, '');
  const parts = path.split('/').filter(Boolean);

  // /api/ΩOS/status
  if (parts[0] === 'status') {
    return new Response(JSON.stringify({
      kernel: 'ΩOS-ULTRA',
      version: ΩMANIFEST_KERNEL.Ωv,
      k: K.status(),
      brain_slots: ΩMANIFEST_KERNEL.brain_protocol.slots
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // /api/ΩOS/brains/*
  if (parts[0] === 'brains') {
    // /api/ΩOS/brains/list
    if (parts[1] === 'list') {
      const list = BrainStore.list();
      return new Response(JSON.stringify({ brains: list }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // /api/ΩOS/brains/get/:id
    if (parts[1] === 'get' && parts[2]) {
      const id = decodeURIComponent(parts[2]);
      const brain = BrainStore.get(id);
      if (!brain) {
        return new Response(JSON.stringify({ error: 'brain_not_found', id }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ brain }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // /api/ΩOS/brains/pack (future: pack from weights/xjson)
    if (parts[1] === 'pack' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const id = body.id || `brain_${Date.now()}`;
      const meta = body.meta || {};
      const brain = await BrainStore.packFromWeights(id, meta);
      return new Response(JSON.stringify({ brain }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // /api/ΩOS/process/list
  if (parts[0] === 'process' && parts[1] === 'list') {
    const processes = Array.from(K.p.values()).map(p => ({
      id: p.id,
      st: p.st,
      ts: p.ts
    }));
    return new Response(JSON.stringify({ processes }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'ΩOS_endpoint_not_found', path }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ----------------------------------------------------------
// SW LIFECYCLE
// ----------------------------------------------------------
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    BrainStore.initDemoBrains();
    const cache = await caches.open(KERNEL_CACHE);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => !k.startsWith(KUHUL_OS))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();

    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ΩOS:kernel_ready',
        kernel: ΩMANIFEST_KERNEL,
        brains: BrainStore.list()
      });
    });
  })());
});

// ----------------------------------------------------------
// FETCH — ROUTE ΩOS + CACHE
// ----------------------------------------------------------
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ΩOS API
  if (url.pathname.startsWith('/api/ΩOS/')) {
    event.respondWith(respondΩOS(url, event.request));
    return;
  }

  // Serve manifest from cache/network
  if (url.pathname === '/manifest.json') {
    event.respondWith((async () => {
      const cache = await caches.open(KERNEL_CACHE);
      const cached = await cache.match('/manifest.json');
      if (cached) return cached;
      try {
        const net = await fetch(event.request);
        cache.put('/manifest.json', net.clone());
        return net;
      } catch {
        return new Response(JSON.stringify(ΩMANIFEST_KERNEL), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })());
    return;
  }

  // NAVIGATION → app shell
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(KERNEL_CACHE);
      const cached = await cache.match('/index.html');
      if (cached) return cached;
      try {
        const net = await fetch('/index.html');
        cache.put('/index.html', net.clone());
        return net;
      } catch {
        return new Response(
          `<html><body style="background:#020617;color:#e8fff6;font-family:system-ui">
             <h1>ΩOS OFFLINE</h1>
             <p>Neural geometry kernel unavailable.</p>
           </body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
    })());
    return;
  }

  // Static with cache-first
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const net = await fetch(event.request);
      cache.put(event.request, net.clone());
      return net;
    } catch {
      return new Response('ΩOS: fetch failed', { status: 503 });
    }
  })());
});

// ----------------------------------------------------------
// MESSAGE CHANNEL — KERNEL / BRAIN CONTROL
// ----------------------------------------------------------
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};
  const port = event.ports && event.ports[0];

  if (type === 'ΩOS:status') {
    port && port.postMessage({
      ok: true,
      kernel: ΩMANIFEST_KERNEL,
      k: K.status(),
      brains: BrainStore.list()
    });
  }

  if (type === 'ΩOS:brains:list') {
    port && port.postMessage({
      ok: true,
      brains: BrainStore.list()
    });
  }

  if (type === 'ΩOS:brains:get' && payload?.id) {
    const brain = BrainStore.get(payload.id);
    port && port.postMessage({
      ok: !!brain,
      brain
    });
  }
});

console.log('ΩOS ULTRA NEURAL GEOMETRY KERNEL — SERVICE WORKER ONLINE');
