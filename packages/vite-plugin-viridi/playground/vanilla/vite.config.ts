import { defineConfig } from 'vite';
import { viridiPlugin } from '@viridi/vite-plugin';

export default defineConfig({
  plugins: [viridiPlugin()],
});
