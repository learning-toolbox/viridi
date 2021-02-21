# Viridi

## A ViteJS plugin to create your a fully customizable, personal knowledge base.

### Overview

A new culture is emerging around [digital gardens](https://maggieappleton.com/garden-history), [evergreen notes](https://notes.andymatuschak.org/Evergreen_notes), [Zettelkasten](http://luhmann.surge.sh/communicating-with-slip-boxes), & [personal knowledge bases](https://en.wikipedia.org/wiki/Personal_knowledge_base) to augment how we learn, create, and think. For those trying to push these ideas forward, existing tools are usually to restrictive or mean that you have to hack together a system to achieve what you want.

Viridi aims to take care of features common across these workflows so that you can focus on exploring the UI/UX in these systems. There are a couple of assumptions to keep in mind:

1. Each note is an invididual markdown file in your file system. We hope that this leads to the easiest writing/editing experience and makes it easier to integrate with your existing knowledge base.
2. To be agnostic to your implementation Viridi must be part of a web build tool. We chose to use ViteJS since it is simple setup/configuration, support for many popular web technologies, and its amazing DX.

### Features:

- Ability to explore the graph of your notes.
- Contextual backlinks between your notes.
- Warnings for broken links and orphaned notes.
- Extract question/answer and cloze deletion prompts.
- Automatic code-splitting of notes.

### Experimenting with

- Ability to view changes to notes (using Git?)
- Better permalinks? ([Inspiration](https://twitter.com/jordwalke/status/1350385770234724353))
- Search
- Incremental build (i.e. better caching in node_modules)
- Better syncing between external apps (i.e Notion, Bear, Roam, ect.)
