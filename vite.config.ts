import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A UI (src/web) é só um adaptador de teste manual: monta um HeldState e chama o
// cérebro (src/core). O core não depende de nada disto.
export default defineConfig({
  plugins: [react()],
});
