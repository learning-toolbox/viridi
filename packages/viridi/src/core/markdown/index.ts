import yaml from 'yaml';
import chalk from 'chalk';
import { Node } from 'unist';
import unified from 'unified';
import html from 'remark-html';
import remove from 'unist-util-remove';
import { select, selectAll } from 'unist-util-select';
import remarkParse from 'remark-parse';
import frontmatter from 'remark-frontmatter';
import {
  ResolveNoteFromTitle,
  wikiLinkPlugin,
  WikiLinkNode,
  RenderWikiLink,
} from './remark-wiki-link';
import { Note, NoteData, NoteFrontmatter, NoteID, Notes, NoteTitleToIdMap, Prompt } from '../types';
import { Config } from '../config';

export { RenderWikiLink, WikiLinkNode, Note as MarkdownNode };

export type ExtractedNoteData = NoteData & {
  linkIds: NoteID[];
  frontmatter?: NoteFrontmatter;
};

export type MarkdownProcessor = ReturnType<typeof createMarkdownProcessor>;

export function createMarkdownProcessor(config: Config) {
  const processor = unified().use(remarkParse).use(frontmatter, ['yaml']).use(html, {
    sanitize: false,
  });

  function processFrontmatter(markdown: string): NoteFrontmatter | undefined {
    const parseTree = processor.parse(markdown);
    return extractFrontmatter(parseTree);
  }

  function processContent(
    markdown: string,
    note: Note,
    notes: Notes,
    titleToIdMap: NoteTitleToIdMap,
    commit?: string
  ): ExtractedNoteData {
    const resolveNoteFromTitle: ResolveNoteFromTitle = (title) => {
      const id = titleToIdMap[title.trim().toLowerCase()];
      if (id === undefined) {
        console.log(
          chalk.yellow.bold('[viridi] ') +
            chalk.yellow(
              `Note '${note.path}'${
                commit ? ` (commit ${commit})` : ''
              } has a broken link: [[${title}]].`
            )
        );
        return undefined;
      }
      return notes[id];
    };

    const md = processor().use(wikiLinkPlugin, config, resolveNoteFromTitle);

    const parseTree = md.parse(markdown);
    const linkIds = extractLinks(parseTree);
    const frontmatter = extractFrontmatter(parseTree);

    let prompts: Prompt[] | undefined;
    if (config.markdown.extractPrompts) {
      prompts = extractPrompts(parseTree);
    }

    const content = md.stringify(parseTree);
    return { linkIds, prompts, content, frontmatter };
  }

  return { processFrontmatter, processContent };
}

function extractFrontmatter(parseTree: Node): any {
  const frontMatterNode = select('yaml', parseTree);
  if (frontMatterNode) {
    const frontmatter = yaml.parse((frontMatterNode as any).value);
    remove(parseTree, 'yaml');
    return frontmatter;
  }
  return undefined;
}

function extractLinks(parseTree: Node): NoteID[] {
  const wikiLinks = selectAll('wikiLink', parseTree);
  // Filter broken links
  return wikiLinks.filter((link) => link.id !== undefined).map((link) => link.id as number);
}

function extractPrompts(parseTree: Node): Prompt[] {
  return [];
}
