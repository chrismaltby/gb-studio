import fetch from "node-fetch";
import {
  isPluginRepositoryEntry,
  PluginRepositoryEntry,
  PluginRepositoryMetadata,
} from "./types";
import { Value } from "@sinclair/typebox/value";
import { checksumString } from "lib/helpers/checksum";
import { join, dirname, relative } from "path";
import l10n from "shared/lib/lang/l10n";
import { createWriteStream, pathExists, remove } from "fs-extra";
import getTmp from "lib/helpers/getTmp";
import AdmZip from "adm-zip";
import { rimraf as rmdir } from "rimraf";
import confirmDeletePlugin from "lib/electron/dialog/confirmDeletePlugin";
import { removeEmptyFoldersBetweenPaths } from "lib/helpers/fs/removeEmptyFoldersBetweenPaths";
import { satisfies } from "semver";
import confirmIncompatiblePlugin from "lib/electron/dialog/confirmIncompatiblePlugin";
import { dialog } from "electron";
import confirmDeletePluginRepository from "lib/electron/dialog/confirmDeletePluginRepository";
import { guardAssetWithinProject } from "lib/helpers/assets";
import { OFFICIAL_REPO_URL } from "consts";
import {
  createPreserveFilesFilter,
  createRemoveFilesFilter,
  isGlobalPluginType,
} from "shared/lib/plugins/pluginHelpers";
import { ensureGlobalPluginsPath } from "./globalPlugins";
import { settingsGet, settingsUpdate } from "lib/helpers/appSettings";

declare const VERSION: string;

const corePluginRepository: PluginRepositoryEntry = {
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

const getValidUserReposList = (
  storedUserRepositories: unknown,
): PluginRepositoryEntry[] => {
  const userRepositories: PluginRepositoryEntry[] = [];
  if (Array.isArray(storedUserRepositories)) {
    for (const entry of storedUserRepositories) {
      if (isPluginRepositoryEntry(entry)) {
        userRepositories.push(entry);
      }
    }
  }
  return userRepositories;
};

const getUserReposList = async (): Promise<PluginRepositoryEntry[]> =>
  getValidUserReposList(await settingsGet("plugins:repositories"));

export const getReposList = async (): Promise<PluginRepositoryEntry[]> => {
  const userRepositories = await getUserReposList();
  return [corePluginRepository, ...userRepositories];
};

export const addUserRepo = async (url: string) => {
  try {
    const data = await (await fetch(url)).json();
    const castData = Value.Cast(PluginRepositoryMetadata, data);
    const name = castData.shortName || castData.name;
    if (!name) {
      throw new Error('Repository "name" is missing');
    }
    await settingsUpdate("plugins:repositories", (storedUserRepositories) => {
      const userRepositories = getValidUserReposList(storedUserRepositories);
      return [
        ...userRepositories.filter((entry) => {
          return entry.url !== url;
        }),
        {
          id: checksumString(url),
          name,
          url,
        },
      ];
    });
  } catch (e) {
    dialog.showErrorBox(l10n("ERROR_PLUGIN_REPOSITORY_NOT_FOUND"), String(e));
  }
};

export const removeUserRepo = async (url: string) => {
  const userRepositories = await getUserReposList();
  const repo = userRepositories.find((entry) => entry.url === url);

  if (!repo) {
    return;
  }

  const cancel = confirmDeletePluginRepository(repo.name, url);
  if (cancel) {
    return;
  }

  await settingsUpdate("plugins:repositories", (storedUserRepositories) => {
    const currentUserRepositories = getValidUserReposList(
      storedUserRepositories,
    );
    return currentUserRepositories.filter((entry) => {
      return entry.url !== url;
    });
  });
};

export const getGlobalPluginsList = async (force?: boolean) => {
  const now = new Date().getTime();
  if (!force && cache.timestamp > now) {
    return cache.value;
  }
  const reposList = await getReposList();
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

export const getRepoUrlById = async (
  id: string,
): Promise<string | undefined> => {
  const reposList = await getReposList();
  return reposList.find((repo) => repo.id === id)?.url;
};

export const addPluginToProject = async (
  projectPath: string,
  pluginId: string,
  repoId: string,
) => {
  try {
    const repoURL = await getRepoUrlById(repoId);
    if (!repoURL) {
      throw new Error(l10n("ERROR_PLUGIN_REPOSITORY_NOT_FOUND"));
    }

    const repos = await getGlobalPluginsList();
    const repo = repos?.find((r) => r.id === repoId);
    if (!repo) {
      throw new Error(l10n("ERROR_PLUGIN_REPOSITORY_NOT_FOUND"));
    }

    const plugin = repo.plugins.find((p) => p.id === pluginId);
    if (!plugin) {
      throw new Error(l10n("ERROR_PLUGIN_NOT_FOUND"));
    }

    const pluginURL = new URL(plugin.filename, repoURL).toString();

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

    const tmpDir = await getTmp();
    const tmpPluginZipPath = join(
      tmpDir,
      `${checksumString(`${repoId}::${pluginId}`)}.zip`,
    );

    const fileStream = createWriteStream(tmpPluginZipPath);
    await new Promise<void>((resolve, reject) => {
      res.body?.pipe(fileStream);
      res.body?.on("error", reject);
      fileStream.on("finish", () => resolve());
    });

    // Clean up any existing files from previous version of plugin
    // Keep any .gbsres files as removing them could unlink assets
    await rmdir(outputPath, {
      filter: createRemoveFilesFilter(plugin.preserveFiles, outputPath),
    });

    // Extract plugin, skipping preserved files that already exist on disk
    const zip = new AdmZip(tmpPluginZipPath);

    const preserveFilesFilter = createPreserveFilesFilter(plugin.preserveFiles);

    if (!plugin.preserveFiles || plugin.preserveFiles.length === 0) {
      zip.extractAllTo(outputPath, true);
    } else {
      for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue;
        const shouldPreserve =
          preserveFilesFilter(entry.entryName) &&
          (await pathExists(join(outputPath, entry.entryName)));
        if (!shouldPreserve) {
          zip.extractEntryTo(entry, outputPath, true, true);
        }
      }
    }

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
