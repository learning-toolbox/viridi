export type UserConfig = {
  /** A path, relative to the `root` configured in Vite, to the directory containing your notes. By default we use the `root` directory. */
  directory?: string;
  /** If your project is using `git` then this option generates a log of changes for each note. It is disabled by default since it causes longer development & build times. */
  gitLogs?: boolean;
  /** Extract question/answer and close-deletion prompts from your notes. */
  extractPrompts?: boolean;
  /** If `true`, Viridi will render wiki links as `<a data-id="{{ note.id }}" href="{{ note.url }}" class="wiki-link">{{ note.title }}<a>`. If `false`, Viridi will render wiki links as `<span data-id="{{ note.id }}" class="wiki-link"></span>` */
  renderWikiLinksAsAnchors?: boolean;
};

export type Config = UserConfig & {
  root: string;
};

const defaultUserConfig: Partial<UserConfig> = {
  renderWikiLinksAsAnchors: true,
};

export function resolveConfig(userConfig: UserConfig = {}, root: string): Config {
  return {
    ...defaultUserConfig,
    ...userConfig,
    root,
  };
}
