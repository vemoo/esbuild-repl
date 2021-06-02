import type { Loader, Plugin } from 'esbuild'

export interface VirtualFile {
  contents: string
  loader?: Loader
}

/**
 * n.b. only supports relative paths with depth=1
 *
 * ok: `./a`, `./b`, `react`; bad: `./a/b`, `../a`
 */
export const virtualFiles = new Map<string, VirtualFile>()

export const virtual: Plugin = {
  name: 'virtual',
  setup(build) {
    build.onResolve({ filter: /^[^\.]/ }, args => {
      return { path: `https://esm.sh/${args.path}`, external: true }
    })
    build.onResolve({ filter: /^\./ }, args => {
      return { path: args.path, namespace: 'virtual-file' }
    })
    build.onLoad({ filter: /.*/, namespace: 'virtual-file' }, args => {
      return virtualFiles.get(args.path)
    })
  },
}
