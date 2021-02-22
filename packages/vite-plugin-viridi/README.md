# ViteJS Viridi Plugin (WIP)

> A ViteJS plugin to help create your own [digital gardens](https://maggieappleton.com/garden-history), [evergreen notes](https://notes.andymatuschak.org/Evergreen_notes), [Zettelkasten](http://luhmann.surge.sh/communicating-with-slip-boxes), and/or [personal knowledge base](https://en.wikipedia.org/wiki/Personal_knowledge_base).

## Introduction

This package is a [ViteJS](https://vitejs.dev/) plugin that parses the markdown files (denoted by the `.md` file extension) located in your project and creates a easily accessible graph of your interconnected notes. One goal is to abstract away file-system importing and parsing/analyzing markdown, so that you can focus on pushing forward what tools for thinking, learning, and creating can do! Our other goal is to be as unobtrusive as we can about determining what you use to build your website or web app. If you are curious why we chose to use ViteJS as our dev server and build tool please read [here](#why-vite).

Getting familiar with Vite will be important, but it should be pretty easy to get up and running! We highly recommend reading through the [ViteJS documentation](https://vitejs.dev/guide/).

## Installation

With Yarn

```bash
$ yarn create @vitejs/app

$ cd <project-name>

$ yarn add @viridi/vite-plugin -D
```

With NPM

```bash
$ npm init @vitejs/app

$ cd <project-name>

$ npm install @viridi/vite-plugin -D
```

Add a `vite.config.js` file and add Viridi as a plugin

```js
const { viridiPlugin } = require('@viridi/vite-plugin');

module.exports = {
  plugins: [viridiPlugin()],
};
```

## Usage

That's all that it takes to get Viridi setup! The first thing to do is to start adding some markdown files and (ideally) start creating links between them. Read more about how markdown works in Viridi [here](#markdown).

Afterwards, you just import the `@viridi` module to access the graph of your knowledge base in any JavaScript or TypeScript file. Viridi handles importing and parsing your markdown files so that you can easily access and manipulate the underlying knowledge graph.

```ts
import notes from '@viridi';

/*
 * This will essentially log the knowledge graph of your notes.
 */
console.log(notes);
```

> Tip: The `@viridi` module is not a JS module in the file system, it is a [virtual file](https://vitejs.dev/guide/api-plugin.html#importing-a-virtual-file) that is created on the fly. It is best practice to use the `@` prefix to note this. This shouldn't affect you either way.

### Markdown

We are using `remark` to parse and analyze the markdown files. Here are some things to keep in mind.

#### Frontmatter (WIP)

Viridi lets you define meta

#### Titles

Viridi extracts the title of a note from the name of the markdown file as opposed to extracting the first `h1` that it encounters in the markdown. This means that most likely don't want to include any `h1` elements in your markdown files. Hopefully it will help remove the duplication of titles and prevent edge cases when trying to parse the markdown. One special case to consider is `index.md`, where the title of the file will become the name of the parent directory. Add a `title` property to the frontmatter to override the title.

### Notes

Each note contains meta-data such as the ID, URL, and time of creation. It also contains references to the notes that it references, and the notes that reference it. Check out the [client typings](https://github.com/learning-toolbox/viridi/blob/main/packages/vite-plugin-viridi/types/client.d.ts) for more details.

#### Code Splitting

Loading the entire knowledge graph and the content for each note will not scale. Viridi solves this problem by automatically code splitting the content of each note. When needed you can easily request that content. The content of note logs are also code split.

```ts
const note: Note = notes.<id>;
const {content, prompt} = await note.data();
```

#### Note Log/History using Git (WIP)

If your project **uses** `git`, you may be interested in seeing how your notes evolve over time. This opt-in feature will create a log of changes for each note. Viridi will dynamically load the content of the log, when you want it.

#### Link Monitoring (WIP)

Since Viridi created the graph of your notes, we can easily print warnings when notes are orphaned (no other notes link to them) or if there is a link to a note that does not exist.

#### Prompt Extraction (WIP)

This is an opt-in feature that we extract question & answer prompts and cloze-deletion prompts from markdown so that its easy to integrate into embeddable spaced repetition software. Prompts are extracted in the order that they appear.

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

## Plugin Configuration

There are a couple of options that you might want to configure to enable certain features. Check out the [`UserConfig`](https://github.com/learning-toolbox/viridi/blob/main/packages/vite-plugin-viridi/src/index.ts#L2) type for more details.

## TypeScript integration

Vite supports Typescript support for the config file. Just call it `vite.config.ts`!

```ts
import { defineConfig } from 'vite';
import { viridiPlugin } from '@viridi/vite-plugin';

export default defineConfig({
  plugins: [viridiPlugin()],
});
```

For client typings please add this shim:

```ts
declare module '@viridi' {
  import { Notes } from '@viridi/vite-plugin/types/client';

  const notes: Notes;
  export default notes;

  export * from '@viridi/vite-plugin/types/client';
}
```

### Areas of research

- Better permalinks?
  - [Inspiration](https://twitter.com/jordwalke/status/1350385770234724353)
- Transclusion
  - At least for backlinks this could be useful. Need some more feedback on this...
- Search
- Also looking for feedback on what we could do to make it easier to search.
- Incremental builds (i.e. better caching in node_modules)
- Better HMR integration

## Why Vite

One of the challenges of writing a library like this is the a build tool needs to be used, which means that we have to choose one.
