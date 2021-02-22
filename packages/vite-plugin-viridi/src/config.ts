export type UserConfig = {
  /** A path, relative to the `root` configured in Vite, to the directory containing your notes. By default we use the `root` directory. */
  directory?: string;
  /** If your project is using `git` then this option generates a log of changes for each note. It is disabled by default since it causes longer development & build times. */
  gitLogs?: boolean;
  /** Extract question/answer and close-deletion prompts from your notes. */
  prompts?: boolean;
};

export type Config = UserConfig & {
  root: string;
};

export function resolveConfig(userConfig: UserConfig = {}, root: string): Config {
  return {
    ...userConfig,
    root,
  };
}
