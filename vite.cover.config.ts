import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config';

export default defineConfig(mergeConfig(baseConfig, {
  build: {
    rollupOptions: {
      input: {
        index: resolve('cover-only.html'),
      },
    },
  },
}));
