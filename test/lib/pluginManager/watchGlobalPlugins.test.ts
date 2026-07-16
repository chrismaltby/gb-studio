import Path from "path";
import { watch } from "chokidar";
import watchGlobalPlugins from "lib/pluginManager/watchGlobalPlugins";
import { ensureGlobalPluginsPath } from "lib/pluginManager/globalPlugins";
import type { Stats } from "fs";

jest.mock("lib/pluginManager/globalPlugins", () => ({
  ensureGlobalPluginsPath: jest.fn(),
}));

const fileStats = { isFile: () => true } as Stats;
const directoryStats = { isFile: () => false } as Stats;

const createCallbacks = () => {
  const unchanged = jest.fn();
  return {
    onChangedThemePlugin: unchanged,
    onChangedLanguagePlugin: unchanged,
    onChangedTemplatePlugin: unchanged,
    onRemoveThemePlugin: unchanged,
    onRemoveLanguagePlugin: unchanged,
    onRemoveTemplatePlugin: unchanged,
  };
};

beforeEach(() => {
  (watch as jest.Mock).mockClear();
});

describe("watchGlobalPlugins", () => {
  it("filters global plugin files by filename without blocking traversal", async () => {
    const globalPluginsPath = Path.join("global", "plugins");
    (ensureGlobalPluginsPath as jest.Mock).mockResolvedValue(globalPluginsPath);

    const stopWatching = await watchGlobalPlugins(createCallbacks());
    const watchMock = watch as jest.Mock;
    const getIgnored = (acceptedPath: string) => {
      const options = watchMock.mock.calls.find(
        ([path, watchOptions]) =>
          path === globalPluginsPath &&
          watchOptions.ignored(acceptedPath, fileStats) === false,
      )?.[1];

      expect(options).toBeDefined();
      return options.ignored as (path: string, stats?: Stats) => boolean;
    };

    const ignoredTheme = getIgnored(
      Path.join(globalPluginsPath, "example", "theme.json"),
    );
    const ignoredLanguage = getIgnored(
      Path.join(globalPluginsPath, "example", "lang.json"),
    );
    const ignoredTemplate = getIgnored(
      Path.join(globalPluginsPath, "example", "project.gbsproj"),
    );

    expect(ignoredTheme(Path.join(globalPluginsPath, "example"))).toBe(false);
    expect(
      ignoredTheme(Path.join(globalPluginsPath, "example"), directoryStats),
    ).toBe(false);
    expect(
      ignoredTheme(
        Path.join(globalPluginsPath, "example", "theme.json"),
        fileStats,
      ),
    ).toBe(false);
    expect(
      ignoredTheme(
        Path.join(globalPluginsPath, "example", "THEME.JSON"),
        fileStats,
      ),
    ).toBe(false);
    expect(
      ignoredTheme(
        Path.join(globalPluginsPath, "example", "other.json"),
        fileStats,
      ),
    ).toBe(true);
    expect(
      ignoredLanguage(
        Path.join(globalPluginsPath, "nested", "plugin", "lang.json"),
        fileStats,
      ),
    ).toBe(false);
    expect(
      ignoredLanguage(
        Path.join(globalPluginsPath, "example", "theme.json"),
        fileStats,
      ),
    ).toBe(true);
    expect(
      ignoredTemplate(
        Path.join(globalPluginsPath, "nested", "plugin", "project.gbsproj"),
        fileStats,
      ),
    ).toBe(false);
    expect(
      ignoredTemplate(
        Path.join(globalPluginsPath, "example", "project.json"),
        fileStats,
      ),
    ).toBe(true);

    stopWatching();
  });
});
