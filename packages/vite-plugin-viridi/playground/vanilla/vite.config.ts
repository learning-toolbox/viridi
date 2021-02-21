import { defineConfig } from 'vite';
import { viridiPlugin } from '@viridi/vite-plugin';

export default defineConfig({
  plugins: [viridiPlugin({ directory: 'notes', gitLogs: true })],
});
