import { Plugin } from 'unified';
import { syntax } from 'micromark-extension-wiki-link';
import { Config } from '../config';
import { Note } from '../types';

export type ResolveNoteFromTitle = (title: string) => Note | undefined;

function fromMarkdown(
  { renderWikiLinksAsAnchors }: Config,
  resolveNoteFromTitle: ResolveNoteFromTitle
) {
  // const defaultPageResolver = (name) => [name.replace(/ /g, '_').toLowerCase()];
  // const pageResolver = options.pageResolver || defaultPageResolver;
  // const defaultHrefTemplate = (permalink) => `/${permalink}`;

  function enterWikiLink(this: any, token: any) {
    this.enter(
      {
        type: 'wikiLink',
        value: null,
        data: {},
      },
      token
    );
  }

  function top(stack: any[]) {
    return stack[stack.length - 1];
  }

  function exitWikiLinkAlias(this: any, token: any) {
    const alias = this.sliceSerialize(token);
    const current = top(this.stack);
    current.data.alias = alias;
  }

  function exitWikiLinkTarget(this: any, token: any) {
    const target = this.sliceSerialize(token);
    const current = top(this.stack);
    current.value = target;
  }

  function exitWikiLink(this: any, token: any) {
    const wikiLink = this.exit(token);
    const title = wikiLink.value;
    const note = resolveNoteFromTitle(title);

    if (note !== undefined) {
      wikiLink.data.id = note.id;
      wikiLink.data.hProperties = {
        'data-id': note.id,
        className: 'wiki-link',
      };

      if (renderWikiLinksAsAnchors) {
        wikiLink.data.hName = 'a';
        wikiLink.data.hProperties.href = note.url;
      } else {
        wikiLink.data.hName = 'span';
      }

      wikiLink.data.hChildren = [
        {
          type: 'text',
          value: title,
        },
      ];
    } else {
      wikiLink.data.hProperties = {
        className: 'wiki-link wiki-link-broken',
      };

      if (renderWikiLinksAsAnchors) {
        wikiLink.data.hName = 'a';
        wikiLink.data.hProperties.href = '';
      } else {
        wikiLink.data.hName = 'span';
      }

      wikiLink.data.hChildren = [
        {
          type: 'text',
          value: title,
        },
      ];
    }
  }

  return {
    enter: {
      wikiLink: enterWikiLink,
    },
    exit: {
      wikiLinkTarget: exitWikiLinkTarget,
      wikiLinkAlias: exitWikiLinkAlias,
      wikiLink: exitWikiLink,
    },
  };
}

export const wikiLinkPlugin: Plugin<[Config, ResolveNoteFromTitle]> = function (
  config,
  resolveNoteFromTitle
) {
  const data = this.data();

  const add = (field: string, extension: object) => {
    const value = data[field];
    if (value instanceof Array) {
      value.push(extension);
    } else {
      data[field] = [extension];
    }
  };

  add('micromarkExtensions', syntax());
  add('fromMarkdownExtensions', fromMarkdown(config, resolveNoteFromTitle));
  // add('toMarkdownExtensions', toMarkdown(opts))
};
