import EventEmitter from "events";
import Path from "path";
import { watch } from "chokidar";
import watchProject from "lib/project/watchProject";

describe("watchProject web templates", () => {
  it("watches local and plugin web template manifests", () => {
    const projectRoot = Path.join("project", "root");
    const onChangedWebTemplates = jest.fn();
    const unchanged = jest.fn();
    const stopWatching = watchProject(
      Path.join(projectRoot, "project.gbsproj"),
      {
        onChangedSprite: unchanged,
        onChangedBackground: unchanged,
        onChangedUI: unchanged,
        onChangedMusic: unchanged,
        onChangedSound: unchanged,
        onChangedFont: unchanged,
        onChangedAvatar: unchanged,
        onChangedEmote: unchanged,
        onChangedTileset: unchanged,
        onRemoveSprite: unchanged,
        onRemoveBackground: unchanged,
        onRemoveUI: unchanged,
        onRemoveMusic: unchanged,
        onRemoveSound: unchanged,
        onRemoveFont: unchanged,
        onRemoveAvatar: unchanged,
        onRemoveEmote: unchanged,
        onRemoveTileset: unchanged,
        onChangedEngineSchema: unchanged,
        onChangedEventPlugin: unchanged,
        onChangedWebTemplates,
      },
    );

    const watchMock = watch as jest.Mock;
    const localWatcherIndex = watchMock.mock.calls.findIndex(
      ([path]) => path === Path.join(projectRoot, "assets", "web"),
    );
    const pluginWatcherIndex = watchMock.mock.calls.findIndex(
      ([path]) => path === Path.join(projectRoot, "plugins"),
    );
    const localWatcher = watchMock.mock.results[localWatcherIndex]
      ?.value as EventEmitter;
    const pluginWatcher = watchMock.mock.results[pluginWatcherIndex]
      ?.value as EventEmitter;
    const localManifest = Path.join(
      projectRoot,
      "assets",
      "web",
      "local",
      "gbstudio.web-template.json",
    );
    const pluginManifest = Path.join(
      projectRoot,
      "plugins",
      "example",
      "assets",
      "web",
      "plugin",
      "gbstudio.web-template.json",
    );

    localWatcher.emit("add", localManifest);
    pluginWatcher.emit("change", pluginManifest);
    localWatcher.emit("unlink", localManifest);
    pluginWatcher.emit("unlink", pluginManifest);

    expect(onChangedWebTemplates).toHaveBeenCalledWith(localManifest);
    expect(onChangedWebTemplates).toHaveBeenCalledWith(pluginManifest);
    expect(onChangedWebTemplates).toHaveBeenCalledTimes(4);

    stopWatching();
  });
});
