import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/modules/**/*.ts'],
      exclude: ['**/*.dto.ts', '**/*.module.ts', '**/*.spec.ts'],
    },
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    // Permite imports con extension .js (recomendado por module:NodeNext)
    // resolviedo al .ts correspondiente, para encajar tsc + vitest.
    alias: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  },
});
