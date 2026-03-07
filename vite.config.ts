import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'ES2022',
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
