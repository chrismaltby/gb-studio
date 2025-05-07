import semverGt from "semver/functions/gt";
import { join } from "path";
import type {
  InstalledPluginData,
  PluginMetadata,
  PluginRepositoryMetadata,
  PluginType,
} from "lib/pluginManager/types";
import { assertUnreachable } from "shared/lib/helpers/assert";
import l10n from "shared/lib/lang/l10n";

export type PluginItem = {
  id: string;
  name: string;
  plugin: PluginMetadata;
  repo: PluginRepositoryMetadata;
  installedVersion?: string;
  updateAvailable: boolean;
};

export type OptionalPluginType = PluginType | "";

const globalPlugins: PluginType[] = ["theme", "lang", "template"];

export const isGlobalPluginType = (type: PluginType) => {
  return globalPlugins.includes(type);
};

export const pluginNameForType = (type: PluginType) => {
  if (type === "assetPack") {
    return l10n("FIELD_ASSET_PACK");
  }
  if (type === "eventsPlugin") {
    return l10n("FIELD_EVENTS_PLUGIN");
  }
  if (type === "enginePlugin") {
    return l10n("FIELD_ENGINE_PLUGIN");
  }
  if (type === "lang") {
    return l10n("FIELD_LANGUAGE_PLUGIN");
  }
  if (type === "template") {
    return l10n("FIELD_TEMPLATE_PLUGIN");
  }
  if (type === "theme") {
    return l10n("MENU_THEME");
  }
  assertUnreachable(type);
};

export const pluginDescriptionForType = (type: PluginType) => {
  if (type === "assetPack") {
    return l10n("FIELD_ASSET_PACK_DESC");
  }
  if (type === "eventsPlugin") {
    return l10n("FIELD_EVENTS_PLUGIN_DESC");
  }
  if (type === "enginePlugin") {
    return l10n("FIELD_ENGINE_PLUGIN_DESC");
  }
  if (type === "lang") {
    return l10n("FIELD_LANGUAGE_PLUGIN_DESC");
  }
  if (type === "template") {
    return l10n("FIELD_TEMPLATE_PLUGIN_DESC");
  }
  if (type === "theme") {
    return l10n("FIELD_THEME_PLUGIN_DESC");
  }
  assertUnreachable(type);
};

export const buildPluginItems = (
  installedPlugins: InstalledPluginData[],
  repos: PluginRepositoryMetadata[]
): PluginItem[] => {
  const items: PluginItem[] = [];
  for (const repo of repos) {
    for (const plugin of repo.plugins) {
      const installedVersion = installedPlugins.find((p) => {
        return p.path === join(plugin.id, "plugin.json");
      })?.version;
      items.push({
        id: `${repo.id}-${plugin.id}`,
        name: plugin.name,
        installedVersion,
        updateAvailable: installedVersion
          ? semverGt(plugin.version, installedVersion)
          : false,
        plugin,
        repo,
      });
    }
  }
  return items;
};

export const filterPluginItems = (
  pluginItems: PluginItem[],
  searchTerm: string,
  typeFilter: OptionalPluginType,
  repoFilter: string
): PluginItem[] => {
  return pluginItems
    .filter((item) => {
      if (typeFilter && item.plugin.type !== typeFilter) {
        return false;
      }
      if (repoFilter && item.repo.id !== repoFilter) {
        return false;
      }
      const searchKey =
        `${item.plugin.filename} ${item.name}`.toLocaleUpperCase();
      const search = searchTerm.toLocaleUpperCase();
      return searchKey.includes(search);
    })
    .sort((a, b) => {
      const isCoreRepoA = a.repo.id === "core";
      const isCoreRepoB = b.repo.id === "core";
      const isCorePluginA = a.plugin.id.startsWith("core/");
      const isCorePluginB = b.plugin.id.startsWith("core/");

      if (isCoreRepoA && !isCoreRepoB) {
        return -1;
      } else if (!isCoreRepoA && isCoreRepoB) {
        return 1;
      }

      if (isCorePluginA && !isCorePluginB) {
        return -1;
      } else if (!isCorePluginA && isCorePluginB) {
        return 1;
      }

      return a.id.localeCompare(b.id);
    });
};
