import { getVersion, initialize } from './esbuild'
import { virtual, virtualFiles } from './virtual'

// async function main() {
//   const version = await getVersion()
//   const esbuild = await initialize(version)
//   console.log(esbuild.version)
//   const result = await esbuild.build({
//     stdin: { contents: `import React from "react"; console.log(react)` },
//     bundle: true,
//     format: 'esm',
//     plugins: [virtual],
//   })
//   console.log(result.outputFiles![0].text)
// }

// main().catch(console.error)
