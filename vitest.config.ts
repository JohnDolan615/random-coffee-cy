import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@random-coffee/shared': path.resolve(__dirname, './packages/shared/src'),
      '@': path.resolve(__dirname, './apps/next/src'),
    },
  },
});