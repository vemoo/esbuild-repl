const JsDelivrAPI = 'https://data.jsdelivr.com/v1/package/npm/esbuild-wasm'
const urlPrefix = 'https://cdn.jsdelivr.net/npm/esbuild-wasm'
const urls = {
  browser: (version: string) => `${urlPrefix}@${version}/esm/browser.js`,
  wasm: (version: string) => `${urlPrefix}@${version}/esbuild.wasm`,
}

export async function getVersion(forceReload = false) {
  const [entry] = performance.getEntriesByType('navigation')
  const isReload = (entry as PerformanceNavigationTiming)?.type === 'reload'
  const raw = localStorage.getItem('esbuild-repl')
  if (!forceReload && !isReload && raw) {
    const [version, time] = raw.split(':', 2)
    if (Date.now() - +time < 86400 * 7 * 1000) {
      return version
    }
  }
  const r = await fetch(JsDelivrAPI).then(r => r.json())
  const version = r.tags.latest
  localStorage.setItem('esbuild-repl', `${version}:${Date.now()}`)
  return version
}

type esbuild_t = typeof import('esbuild')

export async function initialize(version: string): Promise<esbuild_t> {
  const esbuild: esbuild_t = await import(
    /* @vite-ignore */ urls.browser(version)
  )
  await esbuild.initialize({ wasmURL: urls.wasm(version) })
  return esbuild
}
