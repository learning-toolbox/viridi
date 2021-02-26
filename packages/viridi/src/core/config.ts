import chalk from 'chalk';
import simpleGit from 'simple-git';
import { RenderWikiLink } from './markdown/remark-wiki-link';

export type UserConfig = {
  /** A path, relative to the `root` configured in Vite, to the directory containing your notes. */
  directory: string;
  /**
   * If your project uses `git` then this option generates a log of changes for each note.
   * Be warned that this will increase development & build times.
   */
  gitLogs?: boolean;
  markdown?: {
    /** Extract question/answer and close-deletion prompts from your notes. */
    extractPrompts?: boolean;
    wikiLinks?: {
      /** Function to render a wiki-style link to HTML. Content must be a string.
       * `note` is `undefined` when a note with that title cannot be found.
       * Please note that you must use `className` attribute instead of `class` attribute to specify CSS classes.
       * @default Renders `<a data-id="{{ note.id }}" href="{{ note.url }}" class="viridi-wiki-link">{{ alias || note.title }}<a>`
       */
      render?: RenderWikiLink;
    };
  };
};

export type Config = {
  root: string;
  directory: string;
  gitLogs: boolean;
  markdown: Required<Required<UserConfig>['markdown']>;
};

export function resolveConfig(
  root: string,
  { directory, markdown, gitLogs = false }: UserConfig
): Config {
  if (typeof directory !== 'string') {
    console.log(chalk.red.bold('[viridi] ') + chalk.red('`directory` must be a string.'));
  }

  // Remove trailing slashes.
  if (directory.startsWith('/')) {
    directory.slice(1);
  }

  if (directory.endsWith('/')) {
    directory.slice(0, directory.length - 1);
  }

  if (directory === '') {
    console.log(chalk.red.bold('[viridi] ') + chalk.red('`directory` cannot be an empty string.'));
  }

  if (gitLogs && !simpleGit().checkIsRepo()) {
    gitLogs = false;
    console.log(
      chalk.red.bold('[viridi] ') +
        chalk.red('`gitLogs` is not available since project is not a valid git repository.')
    );
  }

  return {
    root,
    directory,
    gitLogs,
    markdown: {
      extractPrompts: false,
      wikiLinks: {},
      ...markdown,
    },
  };
}
