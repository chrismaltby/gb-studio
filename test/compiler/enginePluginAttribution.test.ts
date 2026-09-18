import fs from "fs-extra";
import os from "os";
import Path from "path";
import { applyEnginePlugins } from "lib/compiler/enginePlugins";

describe("applyEnginePlugins attribution", () => {
  let projectRoot = "";
  let outputRoot = "";

  beforeAll(() => {
    (
      global as typeof globalThis & { RELEASE_VERSION: string }
    ).RELEASE_VERSION = "4.3.2";
  });

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(Path.join(os.tmpdir(), "gbs-plugins-"));
    outputRoot = Path.join(projectRoot, "build");
    await fs.outputFile(Path.join(outputRoot, "src/core/stock.c"), "stock\n");
  });

  afterEach(async () => {
    await fs.remove(projectRoot);
  });

  const addPlugin = async (
    name: string,
    files: Record<string, string>,
    order: number,
  ) => {
    const pluginRoot = Path.join(projectRoot, "plugins", name);
    const engineRoot = Path.join(pluginRoot, "engine");
    await fs.outputJson(Path.join(pluginRoot, "plugin.json"), {
      id: name,
      type: "enginePlugin",
      name,
      version: "1.0.0",
      author: "Test",
      description: "Test",
      gbsVersion: ">=4.0.0",
      order,
    });
    await fs.outputJson(Path.join(engineRoot, "engine.json"), {
      version: "4.3.0-e1",
    });
    await Promise.all(
      Object.entries(files).map(([filename, contents]) =>
        fs.outputFile(Path.join(engineRoot, filename), contents),
      ),
    );
  };

  test("tracks added and stock-replacing sources through plugin overwrites", async () => {
    await addPlugin(
      "plugin-a",
      {
        "src/new.c": "from a\n",
        "src/core/stock.c": "replacement a\n",
        "include/not-buildable.h": "#define TEST 1\n",
      },
      0,
    );
    await addPlugin(
      "plugin-b",
      {
        "src/new.c": "from b\n",
        "src/core/stock.c": "replacement b\n",
      },
      1,
    );

    const attribution = await applyEnginePlugins({
      projectRoot,
      outputRoot,
      expectedEngineVersion: "4.3.0-e1",
      unusedFiles: [],
      progress: jest.fn(),
      warnings: jest.fn(),
    });

    expect(attribution).toEqual({
      ownedFiles: {
        "src/new.c": {
          pluginName: "plugin-b",
          replacesDefault: false,
        },
        "src/core/stock.c": {
          pluginName: "plugin-b",
          replacesDefault: true,
        },
      },
    });
  });

  test("attributes only successfully patched buildable stock sources", async () => {
    await fs.outputFile(
      Path.join(outputRoot, "include/config.h"),
      "#define VALUE 1\n",
    );
    await addPlugin(
      "plugin-a",
      {
        "src/core/stock.c.patch": [
          "Index: src/core/stock.c",
          "--- src/core/stock.c",
          "+++ src/core/stock.c",
          "@@ -1 +1 @@",
          "-stock",
          "+patched stock",
          "",
        ].join("\n"),
        "src/core/failed.c.patch": [
          "Index: src/core/failed.c",
          "--- src/core/failed.c",
          "+++ src/core/failed.c",
          "@@ -1 +1 @@",
          "-missing",
          "+patched",
          "",
        ].join("\n"),
        "include/config.h.patch": [
          "Index: include/config.h",
          "--- include/config.h",
          "+++ include/config.h",
          "@@ -1 +1 @@",
          "-#define VALUE 1",
          "+#define VALUE 2",
          "",
        ].join("\n"),
      },
      0,
    );

    const attribution = await applyEnginePlugins({
      projectRoot,
      outputRoot,
      expectedEngineVersion: "4.3.0-e1",
      unusedFiles: [],
      progress: jest.fn(),
      warnings: jest.fn(),
    });

    expect(attribution.ownedFiles).toEqual({
      "src/core/stock.c": {
        pluginName: "plugin-a",
        replacesDefault: true,
      },
    });
  });

  test("preserves original stock ownership across later plugin patches", async () => {
    await addPlugin(
      "plugin-a",
      {
        "src/new.c": "new from a\n",
        "src/core/stock.c.patch": [
          "Index: src/core/stock.c",
          "--- src/core/stock.c",
          "+++ src/core/stock.c",
          "@@ -1 +1 @@",
          "-stock",
          "+stock from a",
          "",
        ].join("\n"),
      },
      0,
    );
    await addPlugin(
      "plugin-b",
      {
        "src/new.c.patch": [
          "Index: src/new.c",
          "--- src/new.c",
          "+++ src/new.c",
          "@@ -1 +1 @@",
          "-new from a",
          "+new from b",
          "",
        ].join("\n"),
        "src/core/stock.c.patch": [
          "Index: src/core/stock.c",
          "--- src/core/stock.c",
          "+++ src/core/stock.c",
          "@@ -1 +1 @@",
          "-stock from a",
          "+stock from b",
          "",
        ].join("\n"),
      },
      1,
    );

    const attribution = await applyEnginePlugins({
      projectRoot,
      outputRoot,
      expectedEngineVersion: "4.3.0-e1",
      unusedFiles: [],
      progress: jest.fn(),
      warnings: jest.fn(),
    });

    expect(attribution.ownedFiles).toEqual({
      "src/new.c": {
        pluginName: "plugin-b",
        replacesDefault: false,
      },
      "src/core/stock.c": {
        pluginName: "plugin-b",
        replacesDefault: true,
      },
    });
  });
});
