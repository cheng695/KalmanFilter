import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 支持 file:// 或任意路径部署
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
