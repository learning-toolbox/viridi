import { Plugin } from 'unified';
import { syntax } from 'micromark-extension-wiki-link';
import { Config } from '../config';
import { Note } from '../types';

export type ResolveNoteFromTitle = (title: string) => Note | undefined;

export type WikiLinkNode = {
  tag: string;
  attributes?: Record<string, string | number | undefined>;
  content?: string;
};

export type RenderWikiLink = (title: string, alias?: string, note?: Note) => WikiLinkNode;

function fromMarkdown(config: Config, resolveNoteFromTitle: ResolveNoteFromTitle) {
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
    current.alias = alias;
  }

  function exitWikiLinkTarget(this: any, token: any) {
    const target = this.sliceSerialize(token);
    const current = top(this.stack);
    current.value = target;
  }

  function exitWikiLink(this: any, token: any) {
    const wikiLink = this.exit(token);
    const { alias, value: title } = wikiLink;
    const note = resolveNoteFromTitle(title);

    // Add `id` so we can use it to extract the links in this note
    wikiLink.id = note?.id;

    if (config.markdown.wikiLinks.render !== undefined) {
      const { tag, attributes, content } = config.markdown.wikiLinks.render(title, alias, note);
      wikiLink.data.hName = tag;
      if (attributes) {
        wikiLink.data.hProperties = attributes;
      }

      if (content) {
        wikiLink.data.hChildren = [{ type: 'text', value: content }];
      }
      return;
    }

    wikiLink.data.hName = 'a';
    wikiLink.data.hChildren = [{ type: 'text', value: title }];
    if (note !== undefined) {
      wikiLink.data.id = note.id;
      wikiLink.data.hProperties = {
        'data-id': note.id,
        className: 'viridi-wiki-link',
      };

      wikiLink.data.hProperties.href = note.url;
    } else {
      // Rename the type of node so that the dead link is not included in the links/backlinks
      wikiLink.type = 'deadWikiLink';
      wikiLink.data.hProperties = {
        className: 'viridi-broken-wiki-link',
      };

      wikiLink.data.hProperties.href = '#';
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

  add('micromarkExtensions', syntax({ aliasDivider: ' | ' }));
  add('fromMarkdownExtensions', fromMarkdown(config, resolveNoteFromTitle));
  // add('toMarkdownExtensions', toMarkdown(opts))
};
