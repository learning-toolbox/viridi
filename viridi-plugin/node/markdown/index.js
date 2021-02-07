import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { slugify } from './plugins/slugify';

/**
 * @return {ReturnType<typeof import('markdown-it')>}
 */
export function createMarkdownRenderer() {
  const md = MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });

  md.use(anchor, {
    slugify,
    permalink: true,
    permalinkBefore: true,
    permalinkSymbol: '#',
    permalinkAttrs: () => ({ 'aria-hidden': true }),
  });

  return md;
}
