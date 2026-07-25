import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: '/twitchAddons/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        valorantBadge: `${root}valorant/badge/index.html`,
      },
    },
  },
});
