const CACHE_NAME = 'mx2svg-pwa-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './abr_engine.js'];

importScripts('./abr_engine.js');

let modelLoaded = false;
let transformers = null;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
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
