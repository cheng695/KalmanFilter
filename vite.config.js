import { defineConfig } from 'vite';

export default defineConfig({
  base: '/KalmanFilter/', // GitHub Pages 部署路径
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
