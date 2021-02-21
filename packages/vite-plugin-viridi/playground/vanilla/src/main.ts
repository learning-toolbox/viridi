import pages from '@viridi';
import page from '/notes/index.md';

console.log(pages, page);

const app = document.querySelector('#app');

if (app) {
  app.innerHTML = `
    <nav>
      <ul>
        ${Object.values(pages)
          .map((page) => `<li><a href="${page.path}">${page.title} (${page.id})</a></li>`)
          .join('\n')}
      </ul>    
    </nav>
    <h1>${page.title}</h1>
    ${page.content}
  `;
}
