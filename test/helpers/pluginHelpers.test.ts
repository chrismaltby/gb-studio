import {
  InstalledPluginData,
  PluginRepositoryMetadata,
  PluginType,
} from "lib/pluginManager/types";
import {
  buildPluginItems,
  createPreserveFilesFilter,
  createRemoveFilesFilter,
  filterPluginItems,
  isGlobalPluginType,
  pluginDescriptionForType,
  PluginItem,
  pluginNameForType,
} from "shared/lib/plugins/pluginHelpers";

const types: PluginType[] = [
  "assetPack",
  "eventsPlugin",
  "enginePlugin",
  "webTemplatePlugin",
  "theme",
  "lang",
  "template",
];

describe("isGlobalPluginType", () => {
  test("should detect global plugin types", () => {
    expect(isGlobalPluginType("theme")).toEqual(true);
    expect(isGlobalPluginType("lang")).toEqual(true);
    expect(isGlobalPluginType("template")).toEqual(true);
  });

  test("should detect local plugin types", () => {
    expect(isGlobalPluginType("assetPack")).toEqual(false);
    expect(isGlobalPluginType("eventsPlugin")).toEqual(false);
    expect(isGlobalPluginType("enginePlugin")).toEqual(false);
    expect(isGlobalPluginType("webTemplatePlugin")).toEqual(false);
  });
});

describe("pluginNameForType", () => {
  test("should get localised name for a plugin type", () => {
    for (const t of types) {
      expect(pluginNameForType(t)).toBeString();
    }
  });

  test("should throw for unknown types", () => {
    expect(() => pluginNameForType("unknown" as PluginType)).toThrow();
  });
});

describe("pluginDescriptionForType", () => {
  test("should get localised name for a plugin type", () => {
    for (const t of types) {
      expect(pluginDescriptionForType(t)).toBeString();
    }
  });

  test("should throw for unknown types", () => {
    expect(() => pluginDescriptionForType("unknown" as PluginType)).toThrow();
  });
});

describe("buildPluginItems", () => {
  test("should mark installed plugins", () => {
    const installedPlugins: InstalledPluginData[] = [
      {
        path: "plugins/p2/plugin.json",
        version: "1.0.0",
      },
    ];
    const repos: PluginRepositoryMetadata[] = [
      {
        id: "repo1",
        name: "Repo 1",
        shortName: "r1",
        author: "Test",
        description: "Testing",
        plugins: [
          {
            id: "plugins/p1",
            name: "Plugin 1",
            author: "Test",
            description: "Testing",
            type: "assetPack",
            version: "1.0.0",
            gbsVersion: "4.2.0",
            filename: "plugins/p1/plugin.zip",
          },
          {
            id: "plugins/p2",
            name: "Plugin 2",
            author: "Test",
            description: "Testing",
            type: "assetPack",
            version: "1.0.0",
            gbsVersion: "4.2.0",
            filename: "plugins/p2/plugin.zip",
          },
        ],
      },
    ];
    const output = buildPluginItems(installedPlugins, repos);
    expect(output.length).toEqual(2);
    expect(output[0]?.installedVersion).toBeUndefined();
    expect(output[1]?.installedVersion).toEqual("1.0.0");
  });

  test("should flag if update is available", () => {
    const installedPlugins: InstalledPluginData[] = [
      {
        path: "plugins/p1/plugin.json",
        version: "1.1.0",
      },
      {
        path: "plugins/p2/plugin.json",
        version: "1.2.0",
      },
    ];
    const repos: PluginRepositoryMetadata[] = [
      {
        id: "repo1",
        name: "Repo 1",
        shortName: "r1",
        author: "Test",
        description: "Testing",
        plugins: [
          {
            id: "plugins/p1",
            name: "Plugin 1",
            author: "Test",
            description: "Testing",
            type: "assetPack",
            version: "2.0.0",
            gbsVersion: "4.2.0",
            filename: "plugins/p1/plugin.zip",
          },
          {
            id: "plugins/p2",
            name: "Plugin 2",
            author: "Test",
            description: "Testing",
            type: "assetPack",
            version: "1.2.0",
            gbsVersion: "4.2.0",
            filename: "plugins/p2/plugin.zip",
          },
        ],
      },
    ];
    const output = buildPluginItems(installedPlugins, repos);
    expect(output.length).toEqual(2);
    expect(output[0]?.installedVersion).toEqual("1.1.0");
    expect(output[1]?.installedVersion).toEqual("1.2.0");
    expect(output[0]?.updateAvailable).toEqual(true);
    expect(output[1]?.updateAvailable).toEqual(false);
  });

  test("should not flag if repo version is older than installed version", () => {
    const installedPlugins: InstalledPluginData[] = [
      {
        path: "plugins/p1/plugin.json",
        version: "1.1.0",
      },
    ];
    const repos: PluginRepositoryMetadata[] = [
      {
        id: "repo1",
        name: "Repo 1",
        shortName: "r1",
        author: "Test",
        description: "Testing",
        plugins: [
          {
            id: "plugins/p1",
            name: "Plugin 1",
            author: "Test",
            description: "Testing",
            type: "assetPack",
            version: "1.0.0",
            gbsVersion: "4.2.0",
            filename: "plugins/p1/plugin.zip",
          },
        ],
      },
    ];
    const output = buildPluginItems(installedPlugins, repos);
    expect(output.length).toEqual(1);
    expect(output[0]?.installedVersion).toEqual("1.1.0");
    expect(output[0]?.updateAvailable).toEqual(false);
  });
});

describe("filterPluginItems", () => {
  const pluginItems: PluginItem[] = [
    {
      id: "p1",
      name: "p1",
      plugin: {
        id: "core/p1",
        type: "assetPack",
        version: "0.0.1",
        gbsVersion: "4.2.0",
        name: "P1",
        author: "Test",
        description: "Testing",
        filename: "p1/plugin.zip",
      },
      repo: {
        id: "r1",
        name: "Repo1",
        author: "Test",
        description: "Testing",
        shortName: "R1",
        plugins: [],
      },
      updateAvailable: false,
    },
    {
      id: "p2",
      name: "p2",
      plugin: {
        id: "p2",
        type: "theme",
        version: "0.0.1",
        gbsVersion: "4.2.0",
        name: "P2",
        author: "Test",
        description: "Testing",
        filename: "p2/plugin.zip",
      },
      repo: {
        id: "r1",
        name: "Repo1",
        author: "Test",
        description: "Testing",
        shortName: "R1",
        plugins: [],
      },
      updateAvailable: false,
    },
    {
      id: "p3",
      name: "p3",
      plugin: {
        id: "p3",
        type: "theme",
        version: "0.0.1",
        gbsVersion: "4.2.0",
        name: "P3",
        author: "Test",
        description: "Testing",
        filename: "p3/plugin.zip",
      },
      repo: {
        id: "core",
        name: "Repo2",
        author: "Test",
        description: "Testing",
        shortName: "R2",
        plugins: [],
      },
      updateAvailable: false,
    },
  ];

  test("should sort output even when not filtered", () => {
    const output = filterPluginItems(pluginItems, "", "", "");
    expect(output.length).toEqual(3);
    expect(output[0]?.id).toEqual("p3");
    expect(output[1]?.id).toEqual("p1");
    expect(output[2]?.id).toEqual("p2");
  });

  test("should allow filtering by plugin type", () => {
    const output = filterPluginItems(pluginItems, "", "assetPack", "");
    const output2 = filterPluginItems(pluginItems, "", "theme", "");
    expect(output.length).toEqual(1);
    expect(output[0]?.plugin.type).toEqual("assetPack");
    expect(output2.length).toEqual(2);
    expect(output2[0]?.plugin.type).toEqual("theme");
    expect(output2[1]?.plugin.type).toEqual("theme");
  });

  test("should allow filtering by repo", () => {
    const output = filterPluginItems(pluginItems, "", "", "core");
    expect(output.length).toEqual(1);
    expect(output[0]?.repo.id).toEqual("core");
  });

  test("should allow filtering by search term", () => {
    const output = filterPluginItems(pluginItems, "P2", "", "");
    expect(output.length).toEqual(1);
    expect(output[0]?.plugin.name).toInclude("P2");
  });
});

describe("createPreserveFilesFilter", () => {
  test("should create a filter that preserves specified files", () => {
    const filter = createPreserveFilesFilter([".png"]);
    expect(filter("assets/image.png")).toEqual(true);
    expect(filter("assets/image.jpg")).toEqual(false);
    expect(filter("file.txt")).toEqual(false);
  });

  test("should create a case insensitive filter when using simple string matches", () => {
    const filter = createPreserveFilesFilter([".PnG"]);
    expect(filter("assets/image.png")).toEqual(true);
    expect(filter("assets/image.PNG")).toEqual(true);
    expect(filter("assets/image.pNg")).toEqual(true);
    expect(filter("assets/image.jpg")).toEqual(false);
    expect(filter("file.txt")).toEqual(false);
  });

  test("should not preserve .gbsres and .gbsres.bak files by default", () => {
    const filter = createPreserveFilesFilter([".png"]);
    expect(filter("file.gbsres")).toEqual(false);
    expect(filter("file.gbsres.bak")).toEqual(false);
  });

  test("should preserve .gbsres if specified by filter", () => {
    const filter = createPreserveFilesFilter([".gbsres"]);
    expect(filter("file.gbsres")).toEqual(true);
    expect(filter("file.gbsres.bak")).toEqual(true);
  });

  test("should allow specifying regex matches", () => {
    const filter = createPreserveFilesFilter(["/^[^/]*\\.gbsres/"]);
    expect(filter("file.gbsres")).toEqual(true);
    expect(filter("subfolder/file.gbsres")).toEqual(false);
  });

  test("should be case sensitive for regex matches by default", () => {
    const filter = createPreserveFilesFilter(["/^[^/]*\\.gbsres/"]);
    expect(filter("file.gbsres")).toEqual(true);
    expect(filter("file.GBSRES")).toEqual(false);
  });

  test("should allow case insensitive regex matches", () => {
    const filter = createPreserveFilesFilter(["/^[^/]*\\.gbsres/i"]);
    expect(filter("file.gbsres")).toEqual(true);
    expect(filter("file.GBSRES")).toEqual(true);
  });

  test("should normalise Windows backslash paths before matching", () => {
    const filter = createPreserveFilesFilter([".png"]);
    expect(filter("assets\\image.png")).toEqual(true);
    expect(filter("assets\\image.jpg")).toEqual(false);
  });

  test("should normalise Windows backslash paths before regex matching", () => {
    const filter = createPreserveFilesFilter(["/^assets\\/.*\\.png$/"]);
    expect(filter("assets\\image.png")).toEqual(true);
    expect(filter("other\\image.png")).toEqual(false);
  });
});

describe("createRemoveFilesFilter", () => {
  test("should filter out .gbsres and .gbsres.bak files to prevent removal", () => {
    const filter = createRemoveFilesFilter([], "plugins/p1");
    expect(filter("plugins/p1/file.gbsres")).toEqual(false);
    expect(filter("plugins/p1/file.gbsres.bak")).toEqual(false);
    expect(filter("plugins/p1/file.txt")).toEqual(true);
  });
  test("should remove unmatched files when no preserve files provided", () => {
    const filter = createRemoveFilesFilter([], "plugins/p1");
    expect(filter("plugins/p1/file.txt")).toEqual(true);
  });
  test("should preserve files matching preserve patterns", () => {
    const filter = createRemoveFilesFilter([".png"], "plugins/p1");
    expect(filter("plugins/p1/assets/image.png")).toEqual(false);
    expect(filter("plugins/p1/assets/image.jpg")).toEqual(true);
    expect(filter("plugins/p1/file.txt")).toEqual(true);
  });
  test("should allow multiple preserve patterns", () => {
    const filter = createRemoveFilesFilter([".png", ".json"], "plugins/p1");
    expect(filter("plugins/p1/assets/image.png")).toEqual(false);
    expect(filter("plugins/p1/data/config.json")).toEqual(false);
    expect(filter("plugins/p1/assets/image.jpg")).toEqual(true);
    expect(filter("plugins/p1/file.txt")).toEqual(true);
  });
  test("should normalise Windows backslash paths before matching", () => {
    const filter = createRemoveFilesFilter([".png"], "plugins\\p1");
    expect(filter("plugins\\p1\\assets\\image.png")).toEqual(false);
    expect(filter("plugins\\p1\\file.gbsres")).toEqual(false);
    expect(filter("plugins\\p1\\assets\\image.jpg")).toEqual(true);
  });
});
