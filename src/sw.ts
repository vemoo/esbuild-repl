export type {};
declare var self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("fetch", e => {
  if (e.request.url.endsWith("esbuild.wasm")) {
    // prettier-ignore
    e.respondWith(caches.open("esbuild-repl:v1").then(c =>
      c.match(e.request).then(r => {
        return r || fetch(e.request).then(s => {
          c.put(e.request, s);
          return s;
        });
      })
    ));
  }
});
