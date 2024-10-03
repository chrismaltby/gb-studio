import chokidar from "chokidar";
import { getGlobalPluginsPath } from "./globalPlugins";

type WatchCallback = (path: string) => void;

const watchGlobalPlugins = (callbacks: {
  onChangedThemePlugin: WatchCallback;
  onChangedLanguagePlugin: WatchCallback;
  onChangedTemplatePlugin: WatchCallback;
  onRemoveThemePlugin: WatchCallback;
  onRemoveLanguagePlugin: WatchCallback;
  onRemoveTemplatePlugin: WatchCallback;
}) => {
  const globalPluginsPath = getGlobalPluginsPath();

  const awaitWriteFinish = {
    stabilityThreshold: 1000,
    pollInterval: 100,
  };

  const themePluginWatcher = chokidar
    .watch([`${globalPluginsPath}/**/theme.{json,JSON}`], {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedThemePlugin)
    .on("change", callbacks.onChangedThemePlugin)
    .on("unlink", callbacks.onRemoveThemePlugin);

  const languagePluginWatcher = chokidar
    .watch([`${globalPluginsPath}/**/lang.{json,JSON}`], {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    })
    .on("add", callbacks.onChangedLanguagePlugin)
    .on("change", callbacks.onChangedLanguagePlugin)
    .on("unlink", callbacks.onRemoveLanguagePlugin);

  const templatePluginWatcher = chokidar
    .watch([`${globalPluginsPath}/**/project.gbsproj`], {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
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
