import { Node } from 'unist';
import unified from 'unified';
import remarkParse from 'remark-parse';
import html from 'remark-html';
import { wikiLinkPlugin } from 'remark-wiki-link';
import { NoteData, NoteID, NoteTitleToIdMap, Prompt } from './types/node';

export type MarkdownNode = Node;

export type ExtractedNoteData = NoteData & {
  linkIds: NoteID[];
};

export type RenderMarkdown = ReturnType<typeof createMarkdownRenderer>;

export function createMarkdownRenderer() {
  const md = unified()
    .use(remarkParse)
    .use(wikiLinkPlugin, {
      hrefTemplate: (permalink: string) => `/${permalink}`,
    })
    .use(html, { sanitize: true });

  return (markdown: string, titleToIdMap: NoteTitleToIdMap): ExtractedNoteData => {
    let prompts: Prompt[];
    let parseTree = md.parse(markdown);
    const linkIds = extractLinks(parseTree, titleToIdMap);
    ({ prompts, parseTree } = extractPrompts(parseTree));
    const content = md.stringify(parseTree);

    return { linkIds, prompts, content };
  };
}

function extractLinks(parseTree: Node, titleToIdMap: NoteTitleToIdMap): NoteID[] {
  return [];
}

function extractPrompts(parseTree: Node) {
  return { prompts: [], parseTree };
}
