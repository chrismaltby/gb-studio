import { getGlobalPluginsPath } from "lib/pluginManager/globalPlugins";
import glob from "glob";
import { promisify } from "util";
import { join, relative } from "path";
import { readJSON } from "fs-extra";
import { locales } from "./initElectronL10N";

const globAsync = promisify(glob);

interface L10NInterface {
  id: string;
  name: string;
}

export const loadL10NPlugin = async (
  path: string,
): Promise<(JSON & { name: string; type: unknown }) | null> => {
  try {
    const l10n = await readJSON(path);
    if (!l10n.name) {
      throw new Error("L10N is missing name");
    }
    return l10n;
  } catch (e) {
    console.error("Unable to load l10n", e);
  }
  return null;
};

export class L10nManager {
  systemL10Ns: Record<string, L10NInterface>;
  pluginL10Ns: Record<string, L10NInterface>;

  constructor() {
    this.systemL10Ns = locales.reduce(
      (memo, locale) => {
        memo[locale] = {
          id: locale,
          name: locale,
        };
        return memo;
      },
      {} as Record<string, L10NInterface>,
    );
    this.pluginL10Ns = {};
  }

  async loadPlugins() {
    this.pluginL10Ns = {};
    const globalPluginsPath = getGlobalPluginsPath();
    const pluginPaths = await globAsync(
      join(globalPluginsPath, "**/lang.json"),
    );

    for (const path of pluginPaths) {
      const l10n = await loadL10NPlugin(path);
      if (l10n) {
        const id = relative(globalPluginsPath, path);
        this.pluginL10Ns[id] = { id, name: l10n.name };
      }
    }
  }

  async loadPlugin(path: string) {
    const globalPluginsPath = getGlobalPluginsPath();
    const l10n = await loadL10NPlugin(path);
    if (l10n) {
      const id = relative(globalPluginsPath, path);
      this.pluginL10Ns[id] = { id, name: l10n.name };
      return this.pluginL10Ns[id];
    }
  }

  getSystemL10Ns() {
    return Object.entries(this.systemL10Ns).map(([id, l10n]) => {
      return {
        id,
        name: l10n.name,
      };
    });
  }

  getPluginL10Ns() {
    return Object.entries(this.pluginL10Ns).map(([id, l10n]) => {
      return {
        id,
        name: l10n.name,
      };
    });
  }
}
