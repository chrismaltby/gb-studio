import fetch from "node-fetch";
import settings from "electron-settings";
import {
  isPluginRepositoryEntry,
  PluginRepositoryEntry,
  PluginRepositoryMetadata,
} from "./types";
import { Value } from "@sinclair/typebox/value";
import { checksumString } from "lib/helpers/checksum";
import { join, dirname, relative } from "path";
import l10n from "shared/lib/lang/l10n";
import { createWriteStream, remove } from "fs-extra";
import getTmp from "lib/helpers/getTmp";
import AdmZip from "adm-zip";
import rimraf from "rimraf";
import { promisify } from "util";
import confirmDeletePlugin from "lib/electron/dialog/confirmDeletePlugin";
import { removeEmptyFoldersBetweenPaths } from "lib/helpers/fs/removeEmptyFoldersBetweenPaths";
import { satisfies } from "semver";
import confirmIncompatiblePlugin from "lib/electron/dialog/confirmIncompatiblePlugin";
import { dialog } from "electron";
import confirmDeletePluginRepository from "lib/electron/dialog/confirmDeletePluginRepository";
import { guardAssetWithinProject } from "lib/helpers/assets";
import { OFFICIAL_REPO_URL } from "consts";
import { isGlobalPluginType } from "shared/lib/plugins/pluginHelpers";
import { ensureGlobalPluginsPath } from "./globalPlugins";

const rmdir = promisify(rimraf);

declare const VERSION: string;

export const corePluginRepository: PluginRepositoryEntry = {
  id: "core",
  name: "GB Studio",
  url: OFFICIAL_REPO_URL,
};

const cache: {
  value: PluginRepositoryMetadata[];
  timestamp: number;
} = {
  value: [],
  timestamp: 0,
};
const oneHour = 60 * 60 * 1000;

export const getUserReposList = (): PluginRepositoryEntry[] => {
  const userRepositories: PluginRepositoryEntry[] = [];
  const storedUserRepositories: unknown = settings.get("plugins:repositories");
  if (Array.isArray(storedUserRepositories)) {
    for (const entry of storedUserRepositories) {
      if (isPluginRepositoryEntry(entry)) {
        userRepositories.push(entry);
      }
    }
  }
  return userRepositories;
};

export const getReposList = (): PluginRepositoryEntry[] => {
  const userRepositories = getUserReposList();
  return [corePluginRepository, ...userRepositories];
};

export const addUserRepo = async (url: string) => {
  try {
    const userRepositories = getUserReposList();
    const data = await (await fetch(url)).json();
    const castData = Value.Cast(PluginRepositoryMetadata, data);
    const name = castData.shortName || castData.name;
    if (!name) {
      throw new Error('Repository "name" is missing');
    }
    const updated: PluginRepositoryEntry[] = [
      ...userRepositories.filter((entry) => {
        return entry.url !== url;
      }),
      {
        id: checksumString(url),
        name,
        url,
      },
    ];
    settings.set("plugins:repositories", updated);
  } catch (e) {
    dialog.showErrorBox(l10n("ERROR_PLUGIN_REPOSITORY_NOT_FOUND"), String(e));
  }
};

export const removeUserRepo = async (url: string) => {
  const userRepositories = getUserReposList();
  const repo = userRepositories.find((entry) => entry.url === url);

  if (!repo) {
    return;
  }

  const cancel = confirmDeletePluginRepository(repo.name, url);
  if (cancel) {
    return;
  }

  const updated = userRepositories.filter((entry) => {
    return entry.url !== url;
  });
  settings.set("plugins:repositories", updated);
};

export const getGlobalPluginsList = async (force?: boolean) => {
  const now = new Date().getTime();
  if (!force && cache.timestamp > now) {
    return cache.value;
  }
  const reposList = getReposList();
  const repos: PluginRepositoryMetadata[] = [];
  for (const repo of reposList) {
    try {
      const data = await (await fetch(repo.url)).json();
      const castData = Value.Cast(PluginRepositoryMetadata, data);
      repos.push({
        ...castData,
        id: repo.id,
        url: repo.url,
      });
    } catch (e) {
      dialog.showErrorBox(l10n("ERROR_PLUGIN_REPOSITORY_NOT_FOUND"), String(e));
    }
  }
  cache.value = repos;
  cache.timestamp = now + oneHour;
  return repos;
};

export const getRepoUrlById = (id: string): string | undefined => {
  const reposList = getReposList();
  return reposList.find((repo) => repo.id === id)?.url;
};

export const addPluginToProject = async (
  projectPath: string,
  pluginId: string,
  repoId: string,
) => {
  try {
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

    const pluginURL =
      plugin.filename.startsWith("http:") ||
      plugin.filename.startsWith("https:")
        ? plugin.filename
        : join(repoRoot, plugin.filename);

    let outputPath = "";

    if (isGlobalPluginType(plugin.type)) {
      const globalPluginsPath = await ensureGlobalPluginsPath();
      outputPath = join(globalPluginsPath, pluginId);
    } else {
      if (!projectPath) {
        dialog.showErrorBox(
          l10n("ERROR_NO_PROJECT_IS_OPEN"),
          l10n("ERROR_OPEN_A_PROJECT_TO_ADD_PLUGIN"),
        );
        return;
      }
      const projectRoot = dirname(projectPath);
      outputPath = join(projectRoot, "plugins", pluginId);
      guardAssetWithinProject(outputPath, projectRoot);
    }

    // Remove -rc* to treat release candidates as identical
    // to releases when confirming plugins are compatible
    // (alpha and beta versions will always warn)
    const releaseVersion = VERSION.replace(/-rc.*/, "");
    if (plugin.gbsVersion && !satisfies(releaseVersion, plugin.gbsVersion)) {
      const cancel = confirmIncompatiblePlugin(
        releaseVersion,
        plugin.gbsVersion,
      );
      if (cancel) {
        return;
      }
    }

    const res = await fetch(pluginURL);

    const tmpDir = getTmp();
    const tmpPluginZipPath = join(
      tmpDir,
      `${checksumString(`${repoId}::${pluginId}`)}.zip`,
    );

    const fileStream = createWriteStream(tmpPluginZipPath);
    await new Promise((resolve, reject) => {
      res.body?.pipe(fileStream);
      res.body?.on("error", reject);
      fileStream.on("finish", resolve);
    });

    // Extract plugin
    const zip = new AdmZip(tmpPluginZipPath);
    zip.extractAllTo(outputPath, true);

    // Remove tmp files
    await remove(tmpPluginZipPath);

    return outputPath;
  } catch (e) {
    dialog.showErrorBox(l10n("ERROR_UNABLE_TO_INSTALL_PLUGIN"), String(e));
  }
};

export const removePluginFromProject = async (
  projectPath: string,
  pluginId: string,
) => {
  const projectRoot = dirname(projectPath);
  const pluginsPath = join(projectRoot, "plugins");
  const outputPath = join(pluginsPath, pluginId);
  guardAssetWithinProject(outputPath, projectRoot);

  const cancel = confirmDeletePlugin(
    pluginId,
    relative(projectRoot, outputPath),
  );
  if (cancel) {
    return;
  }
  await rmdir(outputPath);
  await removeEmptyFoldersBetweenPaths(pluginsPath, dirname(outputPath));
};
