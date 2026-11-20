import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        portfolio: fileURLToPath(new URL('./index.html', import.meta.url)),
        idea: fileURLToPath(new URL('./idea/index.html', import.meta.url)),
      },
    },
  },
});
