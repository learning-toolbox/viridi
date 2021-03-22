import chalk from 'chalk';
import { Parent, Literal, Node } from 'unist';
import remove from 'unist-util-remove';
import parents from 'unist-util-parents';
import { selectAll } from 'unist-util-select';
import toMarkdown from 'mdast-util-to-markdown';
import fromMarkdown from 'mdast-util-from-markdown';
import { Note, Prompt } from '../types';

type NodeWithParent = Parent &
	Literal & {
		node: Parent;
		parent: NodeWithParent | null;
	};

const questionPrefix = 'Q. ';
const answerPrefix = 'A. ';
const clozePrefix = 'C. ';
const answerSplitRegexp = new RegExp(`\n${answerPrefix}`, 'm');
const clozeRegex = /[{}]/g;

export function extractPrompts(node: Parent, note: Note): { prompts: Prompt[]; node: Parent } {
	const wrapped = parents(node) as NodeWithParent;

	// prompts are queried in order of the selectors instead of their place in the parse tree
	const promptTextNodes = selectAll(
		`paragraph>text[value^='${questionPrefix}'],
    paragraph>text[value^='${answerPrefix}'],
    paragraph>text[value^='${clozePrefix}']`,
		wrapped
	) as NodeWithParent[];

	const prompts: Prompt[] = [];
	const nodesToRemove: Node[] = [];

	for (let i = 0; i < promptTextNodes.length; i += 1) {
		const textNode = promptTextNodes[i];

		// Handle wikilinks in QA
		if (isClozeTextNode(textNode)) {
			const clozeNode = textNode.parent!;
			const content = promptToMarkdown(clozeNode);
			prompts.push({ type: 'cloze', content });

			// Remove curly brackets from cloze deletion, and recreate node
			const markdown = content.slice(clozePrefix.length).replace(clozeRegex, '');
			const parent = clozeNode.parent;

			if (parent == null) {
				continue;
			}

			const nodeIndex = parent.children.indexOf(clozeNode);
			parent.node.children[nodeIndex] = fromMarkdown(markdown);
		} else if (isQuestionTextNode(textNode)) {
			const questionNode = textNode.parent!;
			const markdown = promptToMarkdown(questionNode.node);

			// The answer exists in the current node
			if (answerSplitRegexp.test(markdown)) {
				const match = markdown.match(answerSplitRegexp)!;
				const question = markdown.slice(questionPrefix.length, match.index!);
				const answer = markdown.slice(match.index! + answerPrefix.length + 1);

				prompts.push({ type: 'qa', question, answer });

				nodesToRemove.push(questionNode.node);
			} else {
				// Answer should be the next symboling node
				const answerNode = getNextSybling(questionNode);
				const answerTextNode = answerNode?.children[0] as Literal | undefined;
				if (
					answerNode == null ||
					answerTextNode === undefined ||
					!isAnswerTextNode(answerTextNode)
				) {
					const value = promptToMarkdown(questionNode!);
					console.log(
						chalk.red.bold('[viridi] ') +
							chalk.red(`Note '${note.path}' has an unexpected question prompt: '${value}'.`)
					);
					continue;
				}

				const question = markdown.slice(questionPrefix.length);
				const answer = promptToMarkdown(answerNode.node).slice(answerPrefix.length);
				prompts.push({ type: 'qa', question, answer });

				nodesToRemove.push(questionNode.node, answerNode.node);
			}
		} else if (isAnswerTextNode(textNode)) {
			const answerNode = textNode.parent!;
			if (nodesToRemove.includes(answerNode.node)) {
				continue;
			}
			const value = promptToMarkdown(answerNode);
			console.log(
				chalk.red.bold('[viridi] ') +
					chalk.red(`Note '${note.path}' has an unexpected answer prompt: '${value}.'`)
			);
			continue;
		}
	}

	// Remove qa prompt nodes
	remove(wrapped.node, (node: Node) => nodesToRemove.includes(node));

	return { prompts, node: wrapped.node };
}

const isQuestionTextNode = (node: Literal) =>
	typeof node.value === 'string' && node.value.startsWith(questionPrefix);
const isAnswerTextNode = (node: Literal) =>
	typeof node.value === 'string' && node.value.startsWith(answerPrefix);
const isClozeTextNode = (node: Literal) =>
	typeof node.value === 'string' && node.value.startsWith(clozePrefix);

const promptToMarkdown = (node: Node) => toMarkdown(node).replace(/\s+$/, '');

const getNextSybling = (node: NodeWithParent): NodeWithParent | null => {
	const parent = node.parent;

	if (parent == null) {
		return null;
	}

	const nodeIndex = parent.children.indexOf(node);
	const sybling = parent.children[nodeIndex + 1] as NodeWithParent | undefined;
	return sybling || null;
};
