import simpleGit from 'simple-git';
import { History, HistoryOptions, HistoryData } from './types';

const git = simpleGit();

export async function getGitHistory(
  file: string,
  options: HistoryOptions = {}
): Promise<History[]> {
  // Use array options to avoid the '--follow' param
  const result = await git.log([file]);

  const history: History[] = result.all.map(({ hash, date, author_name }) => ({
    commit: hash,
    modified: date,
    author: author_name,
  }));

  // Remove latest commit since the actual file reflects that change.
  // If the file is modified, then the latest commit should be added to history.
  history.shift();

  return history;
}

export async function getLatestCommit(file: string): Promise<History | null> {
  // Use array options to avoid the '--follow' param
  const result = await git.log([file]);

  if (result.latest === null) {
    return null;
  }

  const { hash, date, author_name } = result.latest;
  return {
    commit: hash,
    modified: date,
    author: author_name,
  };
}

export async function getGitHistoryData(path: string, commit: string): Promise<string> {
  // Use a relative path the to file since since the absolute path could not work if we are in a monorepo.
  return await git.show(`${commit}:.${path}`);
}
