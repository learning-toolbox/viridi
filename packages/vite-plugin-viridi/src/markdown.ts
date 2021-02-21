import fs from 'fs';
import glob from 'fast-glob';
import { Node } from 'unist';
import unified from 'unified';
import remarkParse from 'remark-parse';
import html from 'remark-html';
import { wikiLinkPlugin } from 'remark-wiki-link';
import { FullPages, PageId, PagePathToIdMap, Prompt } from './types';
import { cyrb53Hash, extractTitleFromPath, normalizeFilePath } from './utils';

export type RenderPage = (
  path: string,
  content: string,
  pages: FullPages,
  pathToIdMap: Record<string, number>
) => void;

export function createPageRenderer(root: string): RenderPage {
  const md = unified()
    .use(remarkParse)
    .use(wikiLinkPlugin, {
      hrefTemplate: (permalink: string) => `/${permalink}`,
    })
    .use(html, { sanitize: true });
  return (path, content, pages, pathToIdMap) => {
    const normalizedPath = normalizeFilePath(root, path);
    const id = pathToIdMap[normalizedPath];
    const parseTree = md.parse(content);
    const { links, prompts } = parseMarkdownTree(parseTree, pathToIdMap);
    const page = pages[id];
    page.content = md.stringify(parseTree);
    page.prompts = prompts;

    for (const link of links) {
      const linkedPage = pages[link];
      if (!linkedPage?.backlinks.includes(link)) {
        linkedPage.backlinks.push(link);
      }
    }
  };
}

// TODO
function parseMarkdownTree(
  node: Node,
  pathToIdMap: PagePathToIdMap
): { links: PageId[]; prompts: Prompt[] } {
  return {
    links: [],
    prompts: [],
  };
}

export async function parseMarkdownFiles(root: string, renderPage: RenderPage) {
  const fullPages: FullPages = {};
  // uses normalized paths
  const pathToIdMap: PagePathToIdMap = {};
  const pagePaths = glob.sync(`${root}/**/*.md`, { ignore: ['node_modules/**/*'] });
  for (const filePath of pagePaths) {
    const path = normalizeFilePath(root, filePath);
    const id = cyrb53Hash(path);

    pathToIdMap[path] = id;

    fullPages[id] = {
      id,
      path,
      title: extractTitleFromPath(path),
      content: '',
      prompts: [],
      backlinks: [],
    };
  }

  await Promise.all(
    pagePaths.map(async (filePath) => {
      const content = await fs.promises.readFile(filePath, { encoding: 'utf8' });
      renderPage(filePath, content, fullPages, pathToIdMap);
    })
  );

  return { fullPages, pathToIdMap };
}
