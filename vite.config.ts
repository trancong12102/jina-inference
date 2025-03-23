import { resolve } from 'node:path';
import nodeExternals from 'rollup-plugin-node-externals';
import { defineConfig } from 'vitest/config';

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  build: {
    lib: {
      entry: [resolve(import.meta.dirname, 'src/main.ts')],
      formats: ['es'],
    },
    target: 'esnext',
    cssMinify: false,
    cssCodeSplit: false,
    minify: false,
    reportCompressedSize: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 0,
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [nodeExternals()],
  test: {
    setupFiles: ['dotenv/config'],
  },
});
