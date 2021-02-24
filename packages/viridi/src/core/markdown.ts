import yaml from 'yaml';
import { Node } from 'unist';
import unified from 'unified';
import html from 'remark-html';
import remove from 'unist-util-remove';
import { select } from 'unist-util-select';
import remarkParse from 'remark-parse';
import frontmatter from 'remark-frontmatter';
import { wikiLinkPlugin } from 'remark-wiki-link';
import { NoteData, NoteFrontmatter, NoteID, NoteTitleToIdMap, Prompt } from './types';

export type MarkdownNode = Node;

export type ExtractedNoteData = NoteData & {
  linkIds: NoteID[];
  frontmatter?: NoteFrontmatter;
};

export type RenderMarkdown = ReturnType<typeof createMarkdownRenderer>;

export function createMarkdownRenderer() {
  const md = unified()
    .use(frontmatter, ['yaml'])
    .use(remarkParse)
    .use(wikiLinkPlugin, {
      hrefTemplate: (permalink: string) => `/${permalink}`,
    })
    .use(html, { sanitize: true });

  return (markdown: string, titleToIdMap: NoteTitleToIdMap): ExtractedNoteData => {
    const parseTree = md.parse(markdown);
    const frontmatter = extractFrontmatter(parseTree);
    const linkIds = extractLinks(parseTree, titleToIdMap);
    const prompts = extractPrompts(parseTree);
    const content = md.stringify(parseTree);

    return { linkIds, prompts, content, frontmatter };
  };
}

function extractFrontmatter(parseTree: Node): any {
  const frontMatterNode = select('yaml', parseTree);
  if (frontMatterNode) {
    const frontMatter = yaml.parse((frontMatterNode as any).value);
    remove(parseTree, 'yaml');
    return frontMatter;
  }
  return undefined;
}

function extractLinks(parseTree: Node, titleToIdMap: NoteTitleToIdMap): NoteID[] {
  return [];
}

function extractPrompts(parseTree: Node): Prompt[] {
  return [];
}
