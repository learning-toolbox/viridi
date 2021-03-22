import { defineConfig } from 'vite';
import { viridiVitePlugin } from 'viridi';

export default defineConfig({
	plugins: [
		viridiVitePlugin({
			directory: 'notes',
			markdown: {
				extractPrompts: true,
			},
		}),
	],
});
