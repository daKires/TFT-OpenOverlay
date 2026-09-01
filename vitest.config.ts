import { defineConfig } from 'vitest/config';

// Os testes exercitam SÓ o cérebro (src/core), em ambiente Node, sem tocar na UI.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
