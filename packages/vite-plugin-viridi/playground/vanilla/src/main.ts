import pages, { FullPage } from '@viridi';
const dateOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
} as const;

const app = document.querySelector('#app');

async function renderPage(page: FullPage) {
  if (app) {
    const { content } = await page.data();
    app.innerHTML = `
      <nav>
        <ul>
          ${Object.values(pages)
            .map((page) => `<li><a href="${page.path}">${page.title} (${page.id})</a></li>`)
            .join('\n')}
        </ul>    
      </nav>
      <h1>${page.title}</h1>
      <div>Created: ${page.created.toLocaleDateString('default', dateOptions)}</div>
      <div>Last Updated: ${page.lastUpdated.toLocaleDateString('default', dateOptions)}</div>
      ${content}
    `;
  }
}

(async () => {
  const page = Object.values(pages)[0];
  renderPage(page);
})();
