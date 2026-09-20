import { defineConfig } from 'vite';

// Build do CLI (Node). Gera dist/index.js a partir de src/cli.ts.
// Roda DEPOIS do build da UI e não limpa a pasta dist (emptyOutDir: false),
// pra os dois artefatos coexistirem.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'node20',
    minify: false,
    lib: {
      entry: 'src/cli.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
  },
});
