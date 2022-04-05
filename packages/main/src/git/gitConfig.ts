import * as path from 'path';
import fse from 'fs-extra';
import simpleGit from 'simple-git';
import type { GitConfigScope } from 'simple-git';
import { TMP_DIR } from '../constants';

const userConfigDir = path.join(TMP_DIR, 'git', 'user-config');

type GitConfig = Record<string, string>;

export async function getGlobalGitConfig() {
  const globalConfigList = await getGitConfigList({ scope: 'global' });
  const { files: [globalConfigKey], values } = globalConfigList;

  const globalConfig = {
    ...values[globalConfigKey],
  } as Record<string, string>;

  return globalConfig;
}

export async function setGlobalGitConfig(config: GitConfig) {
  await setGitConfig({ config, scope: 'global' });
}

export async function addUserGitConfig(configId: string) {
  const baseDir = path.join(userConfigDir, configId);
  if (fse.pathExistsSync(baseDir)) {
    throw new Error(`Git user config has already existed in ${baseDir}.`);
  }
  await fse.ensureDir(baseDir);
  await initGit(baseDir);

  return getUserConfigPath(configId);
}

export async function getUserGitConfig(configId: string) {
  const baseDir = path.join(userConfigDir, configId);
  const configList = await getGitConfigList({ baseDir, scope: 'local' });
  const { files: [globalConfigKey], values } = configList;

  const userConfig = {
    ...values[globalConfigKey],
  } as Record<string, string>;

  return userConfig;
}

export async function setUserGitConfig(configId: string, config: GitConfig) {
  const baseDir = path.join(userConfigDir, configId);
  await setGitConfig({ scope: 'local', baseDir, config });
}

export async function removeUserGitConfig(configId: string) {
  const configPath = path.join(userConfigDir, configId);
  await fse.remove(configPath);
}

/**
 * for example: /xxx/test/.git/config
 */
export function getUserConfigPath(configId: string) {
  const configPath = path.join(userConfigDir, configId, '.git', 'config');
  if (!fse.pathExistsSync(configPath)) {
    throw new Error(`Git config ${configPath} is not found.`);
  }
  return configPath;
}

async function initGit(baseDir: string) {
  const git = simpleGit({ baseDir });
  await git.init();
}

async function getGitConfigList(
  {
    baseDir,
    scope,
  }: {
    baseDir?: string;
    scope: keyof typeof GitConfigScope;
  }) {
  const git = simpleGit({ baseDir });
  return git.listConfig(scope);
}

async function setGitConfig({
  config,
  scope,
  baseDir,
}: {
  config: Record<string, string>;
  scope: keyof typeof GitConfigScope;
  baseDir?: string;
}) {
  const git = simpleGit({ baseDir });
  const configKeys = Object.keys(config);
  for (const key of configKeys) {
    const value = config[key];
    await git.addConfig(key, value, false, scope);
  }
}