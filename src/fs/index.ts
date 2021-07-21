import { Plugin } from "esbuild";
import { mem } from "./mem";

const namespace = "vfs";

/**
 * @example
 * esbuild.build({
 *   entryPoints: ['./main.ts'],
 *   bundle: true,
 *   plugins: [fs],
 *   outdir: '.', // required for css output
 * })
 */
export const fs: Plugin = {
  name: namespace,
  setup({ initialOptions, onStart, onResolve, onLoad }) {
    // entryPoints -> stdin
    const entry = (initialOptions.entryPoints as string[])[0];
    const [_, file] = mem.find(entry);
    if (!file) {
      onStart(() => ({ warnings: [{ text: `entry file not found: ${entry}` }] }));
    } else {
      delete initialOptions.entryPoints;
      initialOptions.stdin = file;
    }

    const { external = [] } = initialOptions;

    // resolve virtual files
    onResolve({ filter: /.*/ }, args => {
      if (external.includes(args.path)) return { path: args.path, external: true, sideEffects: true };
      const [path, file] = mem.find(args.path);
      if (!file) return { errors: [{ text: `file not found: ${args.path}` }] };
      return { path, namespace, pluginData: file };
    });

    onLoad({ filter: /.*/, namespace }, args => args.pluginData);
  },
};
