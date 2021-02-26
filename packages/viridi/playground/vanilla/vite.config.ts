import { defineConfig } from 'vite';
import { viridiVitePlugin } from 'viridi';

export default defineConfig({
  plugins: [
    viridiVitePlugin({
      directory: 'notes',
      gitLogs: true,
      markdown: {
        wikiLinks: {
          render(title, alias, note) {
            if (note === undefined) {
              return {
                tag: 'a',
                attributes: {
                  href: '#',
                  className: 'dead-wiki-link',
                },
                content: `[[${alias || title}]]`,
              };
            }

            return {
              tag: 'a',
              attributes: {
                'data-id': note.id,
                href: note.url,
                className: 'wiki-link',
              },
              content: `[[${alias || title}]]`,
            };
          },
        },
      },
    }),
  ],
});
