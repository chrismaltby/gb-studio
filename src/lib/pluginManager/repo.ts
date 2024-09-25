import fetch from "node-fetch";
import settings from "electron-settings";
import { ensureStringArray } from "shared/types";
import { PluginRepositoryMetadata } from "./types";
import { Value } from "@sinclair/typebox/value";
import { checksumString } from "lib/helpers/checksum";
import { join, dirname, relative } from "path";
import l10n from "shared/lib/lang/l10n";
import { createWriteStream } from "fs-extra";
import getTmp from "lib/helpers/getTmp";
import AdmZip from "adm-zip";
import rimraf from "rimraf";
import { promisify } from "util";
import confirmDeletePlugin from "lib/electron/dialog/confirmDeletePlugin";
import { removeEmptyFoldersBetweenPaths } from "lib/helpers/fs/removeEmptyFoldersBetweenPaths";
import { satisfies } from "semver";
import confirmIncompatiblePlugin from "lib/electron/dialog/confirmIncompatiblePlugin";

const rmdir = promisify(rimraf);

declare const VERSION: string;

const CORE_PLUGIN_REPOSITORY = "http://127.0.0.1:9999/repository.json";

const cache: {
  value: PluginRepositoryMetadata[];
  timestamp: number;
} = {
  value: [],
  timestamp: 0,
};
const oneHour = 60 * 60 * 1000;

export const getRepoUrls = () => {
  const userRepositoryUrls = ensureStringArray(
    settings.get("plugins:repositories"),
    []
  );
  return [CORE_PLUGIN_REPOSITORY, ...userRepositoryUrls];
};

export const getGlobalPluginsList = async (force?: boolean) => {
  const now = new Date().getTime();
  if (!force && cache.timestamp > now) {
    return cache.value;
  }
  const repositoryUrls = getRepoUrls();
  const repos: PluginRepositoryMetadata[] = [];
  for (const url of repositoryUrls) {
    const data = await (await fetch(url)).json();
    const castData = Value.Cast(PluginRepositoryMetadata, data);
    repos.push({
      ...castData,
      id: checksumString(url),
      url,
    });
  }
  cache.value = repos;
  cache.timestamp = now + oneHour;
  return repos;
};

export const getRepoUrlById = (id: string): string | undefined => {
  const repositoryUrls = getRepoUrls();
  return repositoryUrls.find((url) => checksumString(url) === id);
};

export const addPluginToProject = async (
  projectPath: string,
  pluginId: string,
  repoId: string
) => {
  const repoURL = getRepoUrlById(repoId);
  if (!repoURL) {
    throw new Error(l10n("ERROR_PLUGIN_REPOSITORY_NOT_FOUND"));
  }
  const repoRoot = dirname(repoURL);
  const repos = await getGlobalPluginsList();
  const repo = repos?.find((r) => r.id === repoId);
  if (!repo) {
    throw new Error(l10n("ERROR_PLUGIN_REPOSITORY_NOT_FOUND"));
  }
  const plugin = repo.plugins.find((p) => p.id === pluginId);
  if (!plugin) {
    throw new Error(l10n("ERROR_PLUGIN_NOT_FOUND"));
  }

  // Remove -rc* to treat release candidates as identical
  // to releases when confirming plugins are compatible
  // (alpha and beta versions will always warn)
  const releaseVersion = VERSION.replace(/-rc.*/, "");

  if (plugin.gbsVersion && !satisfies(releaseVersion, plugin.gbsVersion)) {
    const cancel = confirmIncompatiblePlugin(releaseVersion, plugin.gbsVersion);
    if (cancel) {
      return;
    }
  }

  const pluginURL = join(repoRoot, plugin.filename);
  const outputPath = join(dirname(projectPath), "plugins", pluginId);

  const res = await fetch(pluginURL);

  const tmpDir = getTmp();
  const tmpPluginZipPath = join(
    tmpDir,
    `${checksumString(`${repoId}::${pluginId}`)}.zip`
  );

  const fileStream = createWriteStream(tmpPluginZipPath);
  await new Promise((resolve, reject) => {
    res.body?.pipe(fileStream);
    res.body?.on("error", reject);
    fileStream.on("finish", resolve);
  });

  const zip = new AdmZip(tmpPluginZipPath);
  zip.extractAllTo(outputPath, true);

  return outputPath;
};

export const removePluginFromProject = async (
  projectPath: string,
  pluginId: string
) => {
  const projectRoot = dirname(projectPath);
  const pluginsPath = join(projectRoot, "plugins");
  const outputPath = join(pluginsPath, pluginId);
  const cancel = confirmDeletePlugin(
    pluginId,
    relative(projectRoot, outputPath)
  );
  if (cancel) {
    return;
  }
  await rmdir(outputPath);
  await removeEmptyFoldersBetweenPaths(pluginsPath, dirname(outputPath));
};
