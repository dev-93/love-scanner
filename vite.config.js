import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 1600, // face-api 라이브러리가 큰 관계로 한도 상향
    rollupOptions: {
      output: {
        manualChunks: {
          'face-api': ['@vladmandic/face-api'],
        },
      },
    },
  },
})

