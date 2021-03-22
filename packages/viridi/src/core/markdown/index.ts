import yaml from 'yaml';
import chalk from 'chalk';
import { Parent } from 'unist';
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
import { extractPrompts } from './prompts';

export { RenderWikiLink, WikiLinkNode, Note as MarkdownNode };

export type ExtractedNoteData = NoteData & {
	linkIds: NoteID[];
	frontmatter?: NoteFrontmatter;
};

export type MarkdownProcessor = ReturnType<typeof createMarkdownProcessor>;

const baseProcessor = unified().use(remarkParse);
export function createMarkdownProcessor(config: Config) {
	const processor = baseProcessor.use(frontmatter, ['yaml']).use(html, {
		sanitize: false,
	});

	function processFrontmatter(markdown: string): NoteFrontmatter | undefined {
		const node = processor.parse(markdown) as Parent;
		return extractFrontmatter(node);
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

		let node = md.parse(markdown) as Parent;
		const linkIds = extractLinks(node);
		const frontmatter = extractFrontmatter(node);

		let prompts: Prompt[] | undefined;
		if (config.markdown.extractPrompts) {
			({ prompts, node } = extractPrompts(node, note));
		}

		const content = md.stringify(node);
		return { linkIds, prompts, content, frontmatter };
	}

	return { processFrontmatter, processContent };
}

function extractFrontmatter(node: Parent): any {
	const frontMatterNode = select('yaml', node);
	if (frontMatterNode) {
		const frontmatter = yaml.parse((frontMatterNode as any).value);
		remove(node, 'yaml');
		return frontmatter;
	}
	return undefined;
}

function extractLinks(node: Parent): NoteID[] {
	const wikiLinks = selectAll('wikiLink', node);
	// Filter broken links
	return wikiLinks.map((link) => link.id as number).filter((id) => id !== undefined);
}
