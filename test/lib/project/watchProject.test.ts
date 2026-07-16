import EventEmitter from "events";
import Path from "path";
import { watch } from "chokidar";
import watchProject from "lib/project/watchProject";
import type { Stats } from "fs";

const fileStats = { isFile: () => true } as Stats;
const directoryStats = { isFile: () => false } as Stats;

const createCallbacks = () => {
  const unchanged = jest.fn();
  return {
    callbacks: {
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
      onChangedWebTemplates: unchanged,
    },
    unchanged,
  };
};

const getIgnoredForWatch = (
  path: string,
  predicate: (ignored: (path: string, stats?: Stats) => boolean) => boolean,
) => {
  const watchMock = watch as jest.Mock;
  const options = watchMock.mock.calls.find(
    ([watchPath, watchOptions]) =>
      watchPath === path &&
      typeof watchOptions.ignored === "function" &&
      predicate(watchOptions.ignored),
  )?.[1];

  expect(options).toBeDefined();
  return options.ignored as (path: string, stats?: Stats) => boolean;
};

beforeEach(() => {
  (watch as jest.Mock).mockClear();
});

describe("watchProject web templates", () => {
  it("watches local and plugin web template manifests", () => {
    const projectRoot = Path.join("project", "root");
    const onChangedWebTemplates = jest.fn();
    const { callbacks } = createCallbacks();
    const stopWatching = watchProject(
      Path.join(projectRoot, "project.gbsproj"),
      {
        ...callbacks,
        onChangedWebTemplates,
      },
    );

    const watchMock = watch as jest.Mock;
    const pluginManifest = Path.join(
      projectRoot,
      "plugins",
      "example",
      "assets",
      "web",
      "plugin",
      "gbstudio.web-template.json",
    );
    const localWatcherIndex = watchMock.mock.calls.findIndex(
      ([path]) => path === Path.join(projectRoot, "assets", "web"),
    );
    const pluginWatcherIndex = watchMock.mock.calls.findIndex(
      ([path, options]) =>
        path === Path.join(projectRoot, "plugins") &&
        options.awaitWriteFinish &&
        options.ignored(pluginManifest, fileStats) === false,
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

    localWatcher.emit("add", localManifest);
    pluginWatcher.emit("change", pluginManifest);
    localWatcher.emit("unlink", localManifest);
    pluginWatcher.emit("unlink", pluginManifest);

    expect(onChangedWebTemplates).toHaveBeenCalledWith(localManifest);
    expect(onChangedWebTemplates).toHaveBeenCalledWith(pluginManifest);
    expect(onChangedWebTemplates).toHaveBeenCalledTimes(4);

    stopWatching();
  });

  it("filters plugin web template manifests without blocking traversal", () => {
    const projectRoot = Path.join("project", "root");
    const pluginsRoot = Path.join(projectRoot, "plugins");
    const { callbacks } = createCallbacks();
    const stopWatching = watchProject(
      Path.join(projectRoot, "project.gbsproj"),
      callbacks,
    );
    const ignored = getIgnoredForWatch(
      pluginsRoot,
      (candidate) =>
        candidate(
          Path.join(
            pluginsRoot,
            "example",
            "assets",
            "web",
            "gbstudio.web-template.json",
          ),
          fileStats,
        ) === false,
    );

    expect(ignored(Path.join(pluginsRoot, "example"))).toBe(false);
    expect(ignored(Path.join(pluginsRoot, "example"), directoryStats)).toBe(
      false,
    );
    expect(
      ignored(
        Path.join(
          pluginsRoot,
          "example",
          "assets",
          "web",
          "gbstudio.web-template.json",
        ),
        fileStats,
      ),
    ).toBe(false);
    expect(
      ignored(
        Path.join(pluginsRoot, "example", "assets", "web", "other.json"),
        fileStats,
      ),
    ).toBe(true);

    stopWatching();
  });
});

describe("watchProject plugin events", () => {
  it("filters files below events directories without matching similar filenames", () => {
    const projectRoot = Path.join("project", "root");
    const pluginsRoot = Path.join(projectRoot, "plugins");
    const { callbacks } = createCallbacks();
    const stopWatching = watchProject(
      Path.join(projectRoot, "project.gbsproj"),
      callbacks,
    );
    const ignored = getIgnoredForWatch(
      pluginsRoot,
      (candidate) =>
        candidate(
          Path.join(pluginsRoot, "example", "events", "eventFoo.js"),
          fileStats,
        ) === false,
    );

    expect(ignored(Path.join(pluginsRoot, "example"))).toBe(false);
    expect(ignored(Path.join(pluginsRoot, "example"), directoryStats)).toBe(
      false,
    );
    expect(
      ignored(
        Path.join(pluginsRoot, "example", "events", "eventFoo.js"),
        fileStats,
      ),
    ).toBe(false);
    expect(
      ignored(Path.join(pluginsRoot, "example", "events.json"), fileStats),
    ).toBe(true);

    stopWatching();
  });
});

describe("watchProject plugin engine schemas", () => {
  it("watches plugin engine schema files with a dedicated filter", () => {
    const projectRoot = Path.join("project", "root");
    const pluginsRoot = Path.join(projectRoot, "plugins");
    const onChangedEngineSchema = jest.fn();
    const { callbacks } = createCallbacks();
    const stopWatching = watchProject(
      Path.join(projectRoot, "project.gbsproj"),
      {
        ...callbacks,
        onChangedEngineSchema,
      },
    );
    const engineSchemaPath = Path.join(
      pluginsRoot,
      "example",
      "engine",
      "engine.json",
    );
    const ignored = getIgnoredForWatch(
      pluginsRoot,
      (candidate) => candidate(engineSchemaPath, fileStats) === false,
    );

    expect(ignored(Path.join(pluginsRoot, "example"))).toBe(false);
    expect(ignored(Path.join(pluginsRoot, "example"), directoryStats)).toBe(
      false,
    );
    expect(ignored(engineSchemaPath, fileStats)).toBe(false);
    expect(
      ignored(Path.join(pluginsRoot, "example", "engine.json"), fileStats),
    ).toBe(true);

    const watchMock = watch as jest.Mock;
    const pluginEngineWatcherIndex = watchMock.mock.calls.findIndex(
      ([path, options]) =>
        path === pluginsRoot &&
        options.awaitWriteFinish &&
        options.ignored(engineSchemaPath, fileStats) === false,
    );
    const pluginEngineWatcher = watchMock.mock.results[pluginEngineWatcherIndex]
      ?.value as EventEmitter;

    pluginEngineWatcher.emit("change", engineSchemaPath);

    expect(onChangedEngineSchema).toHaveBeenCalledWith(engineSchemaPath);

    stopWatching();
  });
});
