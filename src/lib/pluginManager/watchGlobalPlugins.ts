import { watch } from "chokidar";
import { ensureGlobalPluginsPath } from "./globalPlugins";

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

  const themePluginWatcher = watch(
    [`${globalPluginsPath}/**/theme.{json,JSON}`],
    {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    },
  )
    .on("add", callbacks.onChangedThemePlugin)
    .on("change", callbacks.onChangedThemePlugin)
    .on("unlink", callbacks.onRemoveThemePlugin);

  const languagePluginWatcher = watch(
    [`${globalPluginsPath}/**/lang.{json,JSON}`],
    {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    },
  )
    .on("add", callbacks.onChangedLanguagePlugin)
    .on("change", callbacks.onChangedLanguagePlugin)
    .on("unlink", callbacks.onRemoveLanguagePlugin);

  const templatePluginWatcher = watch(
    [`${globalPluginsPath}/**/project.gbsproj`],
    {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish,
    },
  )
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
