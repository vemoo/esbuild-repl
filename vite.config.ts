import { defineConfig } from "vite";
import { minifyHtml } from "vite-plugin-html";

export default defineConfig(({ command }) => ({
  base: "",
  build: { sourcemap: true },
  plugins: [command === "build" && minifyHtml()],
}));
