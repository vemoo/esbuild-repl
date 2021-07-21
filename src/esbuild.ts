export type esbuild_t = typeof import("esbuild");

const UNPKG = "https://unpkg.com/esbuild-wasm";
const JSDELIVR = "https://cdn.jsdelivr.net/npm/esbuild-wasm";

const urls = {
  browser: (prefix: string, ver: string) => `${prefix}@${ver}/esm/browser.js`,
  wasm: (prefix: string, ver: string) => `${prefix}@${ver}/esbuild.wasm`,
};

async function fetchVersion() {
  const unpkg = new Promise<string>(resolve => {
    fetch("https://unpkg.com/esbuild-wasm?meta").then(r => {
      resolve(r.url.match(/@([^/]+)/)![1]);
    });
  });

  const jsdelivr = new Promise<string>(resolve => {
    fetch("https://data.jsdelivr.com/v1/package/npm/esbuild-wasm")
      .then(r => r.json())
      .then(r => resolve(r.tags.latest));
  });

  const version = await Promise.race([unpkg, jsdelivr]);
  localStorage.setItem("esbuild-repl", `${version}:${Date.now()}`);
  return version;
}

async function getVersion() {
  const raw = localStorage.getItem("esbuild-repl");
  if (raw) {
    const [version, time] = raw.split(":", 2);
    if (Date.now() - +time < 86400 * 3 * 1000) {
      return version;
    }
  }
  return fetchVersion();
}

export const getEsbuild = getVersion().then(async version => {
  const esbuild: esbuild_t = await import(/* @vite-ignore */ urls.browser(JSDELIVR, version));
  await esbuild.initialize({ wasmURL: urls.wasm(JSDELIVR, version) });
  return esbuild;
});
