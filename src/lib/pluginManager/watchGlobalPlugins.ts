import { watch } from "chokidar";
import Path from "path";
import { ensureGlobalPluginsPath } from "./globalPlugins";
import type { Stats } from "fs";

type WatchCallback = (path: string) => void;

const watchGlobalPlugins = async (callbacks: {
  onChangedThemePlugin: WatchCallback;
  onChangedLanguagePlugin: WatchCallback;
  onChangedTemplatePlugin: WatchCallback;
  onRemoveThemePlugin: WatchCallback;
  onRemoveLanguagePlugin: WatchCallback;
  onRemoveTemplatePlugin: WatchCallback;
}) => {
  const globalPluginsPath = await ensureGlobalPluginsPath();

  const awaitWriteFinish = {
    stabilityThreshold: 1000,
    pollInterval: 100,
  };

  const ignoreUnlessFilename = (filename: string) => {
    return (path: string, stats: Stats | undefined) => {
      if (stats?.isFile()) {
        return Path.basename(path).toLowerCase() !== filename;
      }
      return false;
    };
  };

  const themePluginWatcher = watch(globalPluginsPath, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish,
    ignored: ignoreUnlessFilename("theme.json"),
  })
    .on("add", callbacks.onChangedThemePlugin)
    .on("change", callbacks.onChangedThemePlugin)
    .on("unlink", callbacks.onRemoveThemePlugin);

  const languagePluginWatcher = watch(globalPluginsPath, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish,
    ignored: ignoreUnlessFilename("lang.json"),
  })
    .on("add", callbacks.onChangedLanguagePlugin)
    .on("change", callbacks.onChangedLanguagePlugin)
    .on("unlink", callbacks.onRemoveLanguagePlugin);

  const templatePluginWatcher = watch(globalPluginsPath, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish,
    ignored: ignoreUnlessFilename("project.gbsproj"),
  })
    .on("add", callbacks.onChangedTemplatePlugin)
    .on("change", callbacks.onChangedTemplatePlugin)
    .on("unlink", callbacks.onRemoveTemplatePlugin);

  const stopWatching = () => {
    themePluginWatcher.close();
    languagePluginWatcher.close();
    templatePluginWatcher.close();
  };

  return stopWatching;
};

export default watchGlobalPlugins;
