# ViteJS Viridi Plugin

> A ViteJS plugin to create your a fully customizable, personal knowledge base.

## Introduction

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

> Tip: You can also create a `vite.config.ts` if you want better type support.

```ts
import { defineConfig } from 'vite';
import { viridiPlugin } from '@viridi/vite-plugin';

export default defineConfig({
  plugins: [viridiPlugin()],
});
```

## Usage

That's all that it takes to get Viridi setup!

In any JavaScript or TypeScript file you can use the default export of the `@viridi` module to access the graph of your knowledge base. Viridi handles importing and parsing your markdown files so that you can easily access and manipulate the underlying data.

```ts
import notes from '@viridi';

/*
 * This will essentially log the knowledge graph of your notes.
 */
console.log(notes);
```

Each note contains meta-data and references to the notes that it references and the links that reference it. Check out the [client typings](https://github.com/learning-toolbox/viridi/blob/main/packages/vite-plugin-viridi/types/client.d.ts) for more details.

## Plugin Configuration

There are a couple of options that you might want to configure. Check out the [`UserConfig`](https://github.com/learning-toolbox/viridi/blob/main/packages/vite-plugin-viridi/src/index.ts#L2) type for some more details.

## Features:

- Ability to explore the graph of your notes.
- Contextual backlinks between your notes.
- View changes to notes over using Git
- Warnings for broken links and orphaned notes.
- Extract question/answer and cloze deletion prompts.
- Automatic code-splitting of notes.

### Experimenting with

- Better permalinks? ([Inspiration](https://twitter.com/jordwalke/status/1350385770234724353))
- Search
- Incremental build (i.e. better caching in node_modules)
