import fs from 'fs';
import glob from 'fast-glob';
import { Node } from 'unist';
import unified from 'unified';
import remarkParse from 'remark-parse';
import html from 'remark-html';
import { wikiLinkPlugin } from 'remark-wiki-link';
import { Config, FullPages, PageId, PagePathToIdMap, Prompt } from './types';
import {
  cyrb53Hash,
  extractTitleFromPath,
  normalizeFilePath,
  normalizeURL,
  resolvePage,
} from './utils';
import { getGitHistory, getLatestCommit } from './git';

export type RenderPage = (
  path: string,
  content: string,
  pages: FullPages,
  pathToIdMap: Record<string, number>
) => Promise<void>;

export function createPageRenderer(config: Config): RenderPage {
  const md = unified()
    .use(remarkParse)
    .use(wikiLinkPlugin, {
      hrefTemplate: (permalink: string) => `/${permalink}`,
    })
    .use(html, { sanitize: true });
  return async (path, content, pages, pathToIdMap) => {
    const parseTree = md.parse(content);
    const { links, prompts } = parseMarkdownTree(parseTree, pathToIdMap);

    const page = resolvePage(path, config.root, pathToIdMap, pages);
    page.content = md.stringify(parseTree);
    page.prompts = prompts;

    for (const link of links) {
      const linkedPage = pages[link];
      if (!linkedPage?.backlinkIds.includes(link)) {
        linkedPage.backlinkIds.push(link);
      }
    }

    if (config.history && page.history === undefined) {
      page.history = await getGitHistory(path, config.history);
    }

    const lastestCommit = await getLatestCommit(path);
    if (page.lastModified === '') {
      if (lastestCommit !== null) {
        page.lastModified = lastestCommit.modified;
      } else {
        const stats = fs.statSync(path);
        page.lastModified = new Date(Math.round(stats.birthtimeMs)).toString();
      }
    } else {
      const stats = fs.statSync(path);
      page.lastModified = new Date(Math.round(stats.birthtimeMs)).toString();

      // If the file has been modified since the last commit show the last commit in history
      if (
        config.history &&
        lastestCommit !== null &&
        page.history?.[0]?.commit !== lastestCommit.commit
      ) {
        page.history?.unshift(lastestCommit);
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

export async function parseMarkdownFiles({ root, directory }: Config, renderPage: RenderPage) {
  const fullPages: FullPages = {};
  // uses normalized paths
  const pathToIdMap: PagePathToIdMap = {};
  const pagePaths = glob.sync(`${root}/${directory ? directory + '/' : ''}**/*.md`, {
    ignore: ['node_modules/**/*'],
  });
  for (const path of pagePaths) {
    const normalizedPath = normalizeFilePath(root, path);
    const id = cyrb53Hash(path);
    const url = normalizeURL(root, path);
    pathToIdMap[normalizedPath] = id;
    const stats = fs.statSync(path);

    // Create an empty page
    fullPages[id] = {
      id,
      path: normalizedPath,
      url,
      lastModified: '',
      created: new Date(Math.round(stats.birthtimeMs)).toString(),
      title: extractTitleFromPath(url),
      content: '',
      prompts: [],
      backlinkIds: [],
    };
  }

  await Promise.all(
    pagePaths.map(async (filePath) => {
      const content = await fs.promises.readFile(filePath, { encoding: 'utf8' });
      await renderPage(filePath, content, fullPages, pathToIdMap);
    })
  );

  return { fullPages, pathToIdMap };
}
