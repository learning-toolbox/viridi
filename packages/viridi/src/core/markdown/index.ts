import yaml from 'yaml';
import chalk from 'chalk';
import { Node } from 'unist';
import unified from 'unified';
import html from 'remark-html';
import remove from 'unist-util-remove';
import { select, selectAll } from 'unist-util-select';
import remarkParse from 'remark-parse';
import frontmatter from 'remark-frontmatter';
import { ResolveNoteFromTitle, wikiLinkPlugin } from './remark-wiki-link';
import { Note, NoteData, NoteFrontmatter, NoteID, Notes, NoteTitleToIdMap, Prompt } from '../types';
import { Config } from '../config';
import schema from 'hast-util-sanitize/lib/github';

// Allow anchors and spans to have a some extra attributes for wiki links
schema.attributes.a.push('data-id', 'className');
schema.attributes.span = ['data-id', 'className'];

export type MarkdownNode = Node;

export type ExtractedNoteData = NoteData & {
  linkIds: NoteID[];
  frontmatter?: NoteFrontmatter;
};

export type MarkdownProcessor = ReturnType<typeof createMarkdownProcessor>;

export function createMarkdownProcessor(config: Config) {
  const processor = unified().use(remarkParse).use(frontmatter, ['yaml']).use(html, {
    sanitize: schema,
    // TODO: allow user to control how a wiki link is rendered during build.
    // import all from 'mdast-util-to-hast/lib/all';
    // handlers: {
    //   wikiLink(h, node) {
    //     const tag: string = node.data!.hName as string;
    //     const props = node.data!.hProperties as Record<string, any>;
    //     return h(node, tag, props, all(h, node));
    //   },
    // },
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
    const linkIds = extractLinks(parseTree, titleToIdMap);
    const frontmatter = extractFrontmatter(parseTree);

    let prompts: Prompt[] | undefined;
    if (config.extractPrompts) {
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

function extractLinks(parseTree: Node, titleToIdMap: NoteTitleToIdMap): NoteID[] {
  const wikiLinks = selectAll('wikiLink', parseTree);
  return wikiLinks.map((link) => link.data!.id as number);
}

function extractPrompts(parseTree: Node): Prompt[] {
  return [];
}
