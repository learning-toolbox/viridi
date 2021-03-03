# Viridi (WIP)

> A ViteJS plugin to help create your own [digital gardens](https://maggieappleton.com/garden-history), [evergreen notes](https://notes.andymatuschak.org/Evergreen_notes), [Zettelkasten](http://luhmann.surge.sh/communicating-with-slip-boxes), and/or [personal knowledge base](https://en.wikipedia.org/wiki/Personal_knowledge_base).

## Introduction

Viridi is a unopinionated, unobtrusive [ViteJS](https://vitejs.dev/) plugin that parses the markdown files (denoted by the `.md` file extension) located in your project and creates a graph of your interconnected notes. One goal is to abstract away the file-system and parsing/analyzing markdown, so that you can focus on pushing forward what tools for thinking, learning, and creating can do! Our other goal is to be unobtrusive to determining how you build your website or web app. If you are curious why we chose to use ViteJS as our dev server & build tool please read [here](#why-vite).

Getting familiar with Vite will be important, but it should be pretty easy to get up and running! We highly recommend reading through the [ViteJS documentation](https://vitejs.dev/guide/).

Check out our [demo](https://viridi-vite-demo.netlify.app) (WIP) to see what you can do with Viridi.

## Installation

We require that you use NodeJS >= 12.

With Yarn

```bash
$ yarn create @vitejs/app

$ cd <project-name>

$ yarn add viridi -D

// After adding the following config
$ yarn dev
```

With NPM

```bash
$ npm init @vitejs/app

$ cd <project-name>

$ npm install @viridi -D

// After adding the following config
$ yarn dev
```

Add a `vite.config.js` file and add Viridi as a plugin

```js
const { viridiVitePlugin } = require('viridi');

module.exports = {
  plugins: [viridiVitePlugin({ directory: '<path to notes>' })],
};
```

## Usage

That's all that it takes to get Viridi setup! The first thing to do is to start adding some markdown files and (ideally) start creating links between them. Read more about how markdown works in Viridi [here](#markdown).

Afterwards, you just import the `@viridi` module to access the graph of your knowledge base in any file that you cam import ES modules (i.e JavaScript, TypeScript, JSX, Vue, Svelte, ect.). Viridi handles importing and parsing your markdown files so that you can easily access and manipulate the underlying knowledge graph.

```ts
import {
  /** List of notes sorted by page rank. Each note contains references to the notes that it links and the notes that link it. */
  notes,
  /** Utility function to get note by its ID */
  getNoteByID,
  /** Utility function to get note by its URL */
  getNoteByURL,
} from '@viridi';

// Use the knowledge graph however you desire!
```

> Fun fact: `@viridi` is not a actual JS in your file system, it is a [virtual file](https://vitejs.dev/guide/api-plugin.html#importing-a-virtual-file) that is created on the fly. We use the `@` prefix to denote this.

### Markdown

We are using `remark` to parse and analyze the markdown files. Here are some things to keep in mind and some ways to configure how to render markdown.

#### Frontmatter

Viridi lets you define [YAML]() frontmatter for each note that is extracted into the `frontmatter` property on each note.

```md
## <!-- note.md -->

## stage: 'seedling'
```

#### Titles

Viridi extracts the title of a note from the name of the markdown file as opposed to extracting the first `h1` that it encounters in the markdown. This means that most likely don't want to include any `h1` elements in your markdown files. Hopefully it will help remove the duplication of titles and prevent edge cases when trying to parse the markdown. One case to consider is `index.md`, where the title of the file will become the name of the parent directory. Add a `title` property to the [frontmatter](#frontmatter) to override the title extracted from the file name.

Furthermore, the `id` from each note is generated from the path to that note. This means that changing the title of a note will essentially break its reference from other notes. If you would like to modify the title then we recommend overriding the title in the [frontmatter](#frontmatter). In the future, Viridi might be smart enough to automatically detect when a file moves or is renamed and update the references to that note.

#### Wiki-style Links

To make links between notes, Viridi uses a wiki-style links (e.g. `[[Title]]`) where the title is contained in between double square brackets. Viridi use the title to find the note (case insensitive). If you would like to name the like different than the title of a note then you can add an alias `[[Note title | Alias]]`. In this case `Alias` will be rendered and `Note Title` will be used to find the note.

By default, Viridi renders wiki-style links as anchors as follows: `<a data-note-id="{{ note.id }}" href="{{ note.url }}" class="viridi-wiki-link">{{ alias || note.title }}<a>`. We add the `data-id` attribute rather than `id` since a note could be linked multiple times on a page. You can override how wiki links are rendered to HTML use the `markdown.wikiLink.render` setting. The `data-note-id` attribute is still added if you override how wiki-links are rendered. Check out the [`UserConfig`](https://github.com/learning-toolbox/viridi/blob/main/packages/viridi/src/core/config.ts#L1) type for more details.

```ts
const { viridiVitePlugin } = require('viridi');

module.exports = {
  plugins: [
    viridiVitePlugin({
      directory: 'notes',
      markdown: {
        wikiLinks: {
          // Keep in mind that `note` and `alias` can be `undefined`
          render(title, note, alias) {
            if (note === undefined) {
              return {
                tag: 'a',
                attributes: {
                  href: '#',
                  className: 'dead-wiki-link',
                },
                content: `[[${alias || title}}]]`,
              };
            }

            return {
              tag: 'a',
              attributes: {
                'data-id': note.id,
                href: note.url,
                className: 'wiki-link',
              },
              content: `[[${alias || title}]]`,
            };
          },
        },
      },
    }),
  ],
};
```

##### Broken Links

Viridi will [warn you if wiki links are broken](#monitoring-links), but broken links will still be rendered. By default, Viridi renders broken links as `<a class="viridi-broken-wiki-link">{{ title }}<a>`. If you are overriding how wiki links are displayed then make sure to handle the case when the wiki link is broken, this happens when the `note` passed into your render function is `undefined`.

### Notes

Each note contains meta-data such as the id, URL, time of creation, ect. It also contains references to the notes that it references, and the notes that reference it (i.e backlinks). Check out the [client typings](https://github.com/learning-toolbox/viridi/blob/main/packages/vite-plugin-viridi/client.d.ts) for more details.

#### Code Splitting

Loading the entire knowledge graph and the content for each note will not scale. Viridi solves this problem by automatically code splitting the content of each note. When needed you can easily request that content. The content of note logs are also code split.

```ts
import { notes, Note } from '@viridi';

const note: Note = notes[0];
const { content, prompt } = await note.data();
```

##### Prefetch

Since the knowledge graph is code split by default, we want to make it easy to prefetch data for notes that a user might want to see next without them having to wait for it to load.

```ts
import { prefetch } from '@viridi';

prefetch();
```

Calling `prefetch` will create a `IntersectionObserver` to observe when all elements with a `data-note-id` attribute come into view and load the data of the note. Every time you render new wiki-links, it is expected that you call prefetch. By default, all wiki-style links will be prefetched. If you want to prefetch backlinks, just add a `data-note-id` attribute with the note's id and it will automatically prefetched. In cases were the user has [poor cellular connection(https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType) or wants to [save data](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData) prefetch will do nothing.

#### Page Ranking

[PageRank](https://en.wikipedia.org/wiki/PageRank) is an algorithm to determine the important of each node in a graph. Each note has a `ranking` property to help you determine the relative importance of each note. By default, the `notes`, `links` and `backlinks` properties are sorted by page rank.

#### Note Log/History using Git

If your project **uses** `git`, you may be interested in seeing how your notes evolve over time. You can enable this feature by setting `gitLogs` to `true` when [configuring the Vite plugin](#plugin-configuration). This opt-in feature will create a log of changes for each note. Viridi will dynamically load the content of the log, when you want it. You have access to the content of the note, links to other notes, and extracted prompts (see [Prompt Extraction](prompt-extraction-wip)). For now we do not extract backlinks to a log because this would require mean that Viridi has to recreate the knowledge graph for each commit. In the future, it would be interesting to see the knowledge graph for X amount of commits.

#### Monitoring Links

Since Viridi created the graph of your notes, we can easily print warnings when notes are orphaned (no other notes link to them) or if there is a link to a note that does not exist.

#### Prompt Extraction (WIP)

This is an opt-in feature that we extract question & answer prompts and cloze-deletion prompts from markdown so that its easy to integrate into embeddable spaced repetition software. Prompts are extracted in the order that they appear. You can enable it by setting `extractPrompts` to `true` when [configuring the Vite plugin](#plugin-configuration).

- Question & answer prompts are removed from the markdown output entirely. Markdown used in the prompt is preserved.
- For cloze-deletion prompts, each paragraph is checked to see if it contains curly brackets (`{` and `}`). If it does then that entire paragraph is considered one prompt and the brackets are removed from the markdown output. Markdown used in the prompt is preserved.

```md
Lorem {ipsum} dolor {sit amet}.

Q: When is _"Lorem Ipsum"_ text used?
A: Its used as a placeholder.
```

```ts
const noteData: NoteData = {
  content: '<p>Lorem ipsum dolor sit amet.</p>',
  prompts: [
    {
      type: 'cloze',
      content: 'Lorem {ipsum} dolor {sit amet}.',
    },
    {
      type: 'qa',
      question: 'When is *"Lorem Ipsum"* text used?',
      answer: 'Its used as a placeholder.',
    },
  ],
};
```

## Vite Plugin Configuration

There are a couple of options that you might want to configure to enable certain features. Just pass an object to `viridiPluginVite` to configure the options. Check out the [`UserConfig`](https://github.com/learning-toolbox/viridi/blob/main/packages/viridi/src/core/config.ts#L1) type for more details.

## TypeScript integration

Vite supports using Typescript for the config file. Just call it `vite.config.ts`!

```ts
import { defineConfig } from 'vite';
import { viridiVitePlugin } from 'viridi';

export default defineConfig({
  plugins: [viridiVitePlugin()],
});
```

For client typings please add the following to you `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "viridi/client"]
  },
  "exclude": ["dist", "node_modules"]
}
```

## Examples

Our [playground](https://github.com/learning-toolbox/viridi/tree/main/packages/vite-plugin-viridi/playground) is mostly used for testing, but contains a few examples of how to use Viridi!

## Areas of research

- Pre-rendering (SSG) script
- Better permalinks?
  - [Inspiration](https://twitter.com/jordwalke/status/1350385770234724353)
- Transclusion
  - Still fuzzy what this could look like...
- Search
- Incremental builds (i.e. better caching in node_modules)
- Better HMR integration

## Inspiration

A large inspiration for Viridi is the ongoing research/experiments by [Andy Matuschak
](https://twitter.com/andy_matuschak), particular [his evergreen notes](https://notes.andymatuschak.org/About_these_notes), [Orbit (embeddable SRS)](https://withorbit.com/), and [Note Link Janitor](https://github.com/andymatuschak/note-link-janitor). [Maggie Appleton's](https://twitter.com/Mappletons) writings and ideas (particularly around [Git logs](#git-logs-wip)) has also been very thought provoking.

## Why Vite

Viridi has to be used with a build tool since it only handles "building" your markdown files. We evaluated a handful of options and decided that the ViteJS aligned closest with our goals of staying unobtrusive to your pick of web technology and providing you with fantastic DX with little to no configuration to support your workflow. Vite can handle building SPA, SSR, or SSG applications (although the latter two are still experimental at the time of this writing). We are working towards extracting the core logic of Viridi so that it can be used with other build tools (e.g. Snowpack) and maybe without any build tools?
