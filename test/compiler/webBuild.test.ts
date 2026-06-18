import fs from "fs-extra";
import os from "os";
import Path from "path";
import { dummyProjectResources } from "../dummydata";
import {
  ejectDefaultWebTemplate,
  exportWebBuild,
  getWebTemplateRoot,
  listProjectWebTemplates,
} from "lib/compiler/webBuild";

jest.mock("consts", () => ({
  ...jest.requireActual("consts"),
  binjgbWasmRoot: "/tmp/gbs-web-build-test-binjgb-wasm",
  defaultWebTemplateRoot: "/tmp/gbs-web-build-test-binjgb-template",
}));

const mockBinjgbWasmRoot = "/tmp/gbs-web-build-test-binjgb-wasm";
const mockDefaultWebTemplateRoot = "/tmp/gbs-web-build-test-binjgb-template";
const testRoot = Path.join(os.tmpdir(), "gbs-web-build-test");

const writeWebTemplate = async (
  templateRoot: string,
  marker: string,
  manifest: Record<string, unknown> = {},
) => {
  await fs.ensureDir(templateRoot);
  await fs.writeJSON(Path.join(templateRoot, "gbstudio.web-template.json"), {
    version: 1,
    name: marker,
    ...manifest,
  });
  await fs.writeFile(
    Path.join(templateRoot, "index.html"),
    [
      "___PROJECT_NAME___",
      "___AUTHOR___",
      "___COLORS_HEAD___",
      "___PROJECT_HEAD___",
      marker,
    ].join("\n"),
  );
};

const warnings = () => jest.fn<void, [string]>();

beforeEach(async () => {
  await fs.remove(testRoot);
  await fs.remove(mockBinjgbWasmRoot);
  await fs.remove(mockDefaultWebTemplateRoot);
  await writeWebTemplate(mockDefaultWebTemplateRoot, "default-template");
  await fs.ensureDir(mockBinjgbWasmRoot);
  await fs.writeFile(Path.join(mockBinjgbWasmRoot, "binjgb.js"), "JS");
  await fs.writeFile(Path.join(mockBinjgbWasmRoot, "binjgb.wasm"), "WASM");
  await fs.writeFile(Path.join(mockBinjgbWasmRoot, "README.md"), "README");
});

afterAll(async () => {
  await fs.remove(testRoot);
  await fs.remove(mockBinjgbWasmRoot);
  await fs.remove(mockDefaultWebTemplateRoot);
});

describe("listProjectWebTemplates", () => {
  it("lists local templates and plugin templates with assets/web stripped", async () => {
    const projectRoot = Path.join(testRoot, "project");
    await writeWebTemplate(
      Path.join(projectRoot, "assets", "web", "local-web"),
      "Local Template",
    );
    await writeWebTemplate(
      Path.join(
        projectRoot,
        "plugins",
        "myplugin",
        "assets",
        "web",
        "plugin-web",
      ),
      "Plugin Template",
    );
    await fs.writeFile(
      Path.join(projectRoot, "assets", "web", "not-a-template.txt"),
      "",
    );
    await fs.ensureDir(
      Path.join(projectRoot, "assets", "web", "missing-manifest"),
    );

    const templates = await listProjectWebTemplates(projectRoot);

    expect(templates).toEqual([
      { id: "local-web", name: "Local Template" },
      { id: "plugins/myplugin/plugin-web", name: "Plugin Template" },
    ]);
  });

  it("lists templates with a blank manifest name", async () => {
    const projectRoot = Path.join(testRoot, "project");
    await writeWebTemplate(
      Path.join(projectRoot, "assets", "web", "unnamed-template"),
      "",
    );

    const templates = await listProjectWebTemplates(projectRoot);

    expect(templates).toEqual([{ id: "unnamed-template", name: "" }]);
  });

  it("returns an empty list when no templates exist", async () => {
    const templates = await listProjectWebTemplates(
      Path.join(testRoot, "none"),
    );

    expect(templates).toEqual([]);
  });
});

describe("ejectDefaultWebTemplate", () => {
  it("copies the default web template into assets/web/binjgb", async () => {
    const projectRoot = Path.join(testRoot, "project");
    const outputPath = Path.join(projectRoot, "assets", "web", "binjgb");
    await fs.ensureDir(outputPath);
    await fs.writeFile(Path.join(outputPath, "stale.txt"), "stale");

    const templateName = await ejectDefaultWebTemplate(projectRoot);

    expect(templateName).toBe("binjgb");
    await expect(
      fs.pathExists(Path.join(projectRoot, "assets", "web", "binjgb")),
    ).resolves.toBe(true);
    await expect(
      fs.readFile(
        Path.join(projectRoot, "assets", "web", "binjgb", "index.html"),
        "utf8",
      ),
    ).resolves.toContain("default-template");
    await expect(
      fs.readFile(
        Path.join(projectRoot, "assets", "web", "binjgb", "js", "binjgb.wasm"),
        "utf8",
      ),
    ).resolves.toBe("WASM");
    await expect(
      fs.readFile(
        Path.join(projectRoot, "assets", "web", "binjgb", "js", "README.md"),
        "utf8",
      ),
    ).resolves.toBe("README");
    await expect(
      fs.pathExists(Path.join(outputPath, "stale.txt")),
    ).resolves.toBe(false);
  });
});

describe("getWebTemplateRoot", () => {
  it("returns the default template root when no template is selected", async () => {
    const warn = warnings();

    const templateRoot = await getWebTemplateRoot(testRoot, "", warn);

    expect(templateRoot).toBe(mockDefaultWebTemplateRoot);
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns a local assets/web template root", async () => {
    const projectRoot = Path.join(testRoot, "project");
    const localTemplateRoot = Path.join(projectRoot, "assets", "web", "local");
    await writeWebTemplate(localTemplateRoot, "local");

    const templateRoot = await getWebTemplateRoot(
      projectRoot,
      "local",
      warnings(),
    );

    expect(templateRoot).toBe(localTemplateRoot);
  });

  it("injects assets/web into plugin template paths", async () => {
    const projectRoot = Path.join(testRoot, "project");
    const pluginTemplateRoot = Path.join(
      projectRoot,
      "plugins",
      "myplugin",
      "assets",
      "web",
      "plugin-web",
    );
    await writeWebTemplate(pluginTemplateRoot, "plugin-web");

    const templateRoot = await getWebTemplateRoot(
      projectRoot,
      "plugins/myplugin/plugin-web",
      warnings(),
    );

    expect(templateRoot).toBe(pluginTemplateRoot);
  });

  it("falls back to the default template root when the selected template is missing", async () => {
    const warn = warnings();

    const templateRoot = await getWebTemplateRoot(
      testRoot,
      "missing-template",
      warn,
    );

    expect(templateRoot).toBe(mockDefaultWebTemplateRoot);
    expect(warn).toHaveBeenCalledWith(
      'Web template "missing-template" not found, using default template.',
    );
  });

  it("falls back to the default template root when the selected template has no manifest", async () => {
    const projectRoot = Path.join(testRoot, "project");
    const warn = warnings();
    await fs.ensureDir(Path.join(projectRoot, "assets", "web", "local"));

    const templateRoot = await getWebTemplateRoot(projectRoot, "local", warn);

    expect(templateRoot).toBe(mockDefaultWebTemplateRoot);
    expect(warn).toHaveBeenCalledWith(
      'Web template "local" is missing a valid gbstudio.web-template.json, using default template.',
    );
  });

  it("falls back to the default template root for invalid paths", async () => {
    const warn = warnings();

    const templateRoot = await getWebTemplateRoot(testRoot, "../outside", warn);

    expect(templateRoot).toBe(mockDefaultWebTemplateRoot);
    expect(warn).toHaveBeenCalledWith(
      'Invalid web template "../outside", using default template.',
    );
  });
});

describe("exportWebBuild", () => {
  it("copies the selected template, injects page tokens, and writes config", async () => {
    const projectRoot = Path.join(testRoot, "project");
    const destination = Path.join(testRoot, "dist");
    const romPath = Path.join(testRoot, "game.gbc");
    const templateRoot = Path.join(projectRoot, "assets", "web", "local");
    await writeWebTemplate(templateRoot, "local-template");
    await fs.writeFile(romPath, "ROM");

    await exportWebBuild({
      project: {
        ...dummyProjectResources,
        metadata: {
          ...dummyProjectResources.metadata,
          name: "My <Game>",
          author: 'Chris "GB"',
        },
        settings: {
          ...dummyProjectResources.settings,
          colorMode: "mixed",
          customColorsBlack: "123456",
          customHead: "<meta name='test' />",
          webTemplate: "local",
        },
      },
      projectRoot,
      destination,
      romFilename: "game.gbc",
      romPath,
      warnings: warnings(),
    });

    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.toContain("local-template");
    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.toContain("My Game");
    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.toContain("Chris GB");
    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.toContain("background-color:#123456");
    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.toContain("<meta name='test' />");
    await expect(
      fs.readFile(Path.join(destination, "rom", "game.gbc"), "utf8"),
    ).resolves.toBe("ROM");
    await expect(
      fs.readJSON(Path.join(destination, "gbstudio.json")),
    ).resolves.toMatchObject({
      version: 1,
      rom: "rom/game.gbc",
      project: {
        name: "My <Game>",
        author: 'Chris "GB"',
      },
      colorCorrection: "default",
      customControls: {
        up: dummyProjectResources.settings.customControlsUp,
      },
    });
    await expect(
      fs.pathExists(Path.join(destination, "gbstudio.web-template.json")),
    ).resolves.toBe(false);
    await expect(
      fs.pathExists(Path.join(destination, "js", "binjgb.wasm")),
    ).resolves.toBe(false);
  });

  it("falls back to the default template when the selected template is missing", async () => {
    const destination = Path.join(testRoot, "dist");
    const romPath = Path.join(testRoot, "game.gb");
    const warn = warnings();
    await fs.ensureDir(testRoot);
    await fs.writeFile(romPath, "ROM");

    await exportWebBuild({
      project: {
        ...dummyProjectResources,
        settings: {
          ...dummyProjectResources.settings,
          colorMode: "mono",
          webTemplate: "missing-template",
        },
      },
      projectRoot: Path.join(testRoot, "project"),
      destination,
      romFilename: "game.gb",
      romPath,
      warnings: warn,
    });

    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.toContain("default-template");
    await expect(
      fs.readJSON(Path.join(destination, "gbstudio.json")),
    ).resolves.toMatchObject({
      rom: "rom/game.gb",
    });
    await expect(
      fs.pathExists(Path.join(destination, "gbstudio.web-template.json")),
    ).resolves.toBe(false);
    await expect(
      fs.readFile(Path.join(destination, "js", "binjgb.js"), "utf8"),
    ).resolves.toBe("JS");
    await expect(
      fs.readFile(Path.join(destination, "js", "binjgb.wasm"), "utf8"),
    ).resolves.toBe("WASM");
    await expect(
      fs.readFile(Path.join(destination, "js", "README.md"), "utf8"),
    ).resolves.toBe("README");
    expect(warn).toHaveBeenCalledWith(
      'Web template "missing-template" not found, using default template.',
    );
  });

  it("uses manifest romPath and configPath", async () => {
    const projectRoot = Path.join(testRoot, "project");
    const destination = Path.join(testRoot, "dist");
    const romPath = Path.join(testRoot, "game.gbc");
    const templateRoot = Path.join(projectRoot, "assets", "web", "local");
    await writeWebTemplate(templateRoot, "local-template", {
      romPath: "game/{{romFilename}}",
      configPath: "config/export.json",
    });
    await fs.writeFile(romPath, "ROM");

    await exportWebBuild({
      project: {
        ...dummyProjectResources,
        settings: {
          ...dummyProjectResources.settings,
          webTemplate: "local",
          colorCorrection: "none",
        },
      },
      projectRoot,
      destination,
      romFilename: "game.gbc",
      romPath,
      warnings: warnings(),
    });

    await expect(
      fs.readFile(Path.join(destination, "game", "game.gbc"), "utf8"),
    ).resolves.toBe("ROM");
    await expect(
      fs.readJSON(Path.join(destination, "config", "export.json")),
    ).resolves.toMatchObject({
      rom: "game/game.gbc",
      colorCorrection: "none",
    });
  });

  it("falls back to default template for unsafe manifest paths", async () => {
    const projectRoot = Path.join(testRoot, "project");
    const destination = Path.join(testRoot, "dist");
    const romPath = Path.join(testRoot, "game.gb");
    const warn = warnings();
    const templateRoot = Path.join(projectRoot, "assets", "web", "local");
    await writeWebTemplate(templateRoot, "local-template", {
      romPath: "../game.gb",
    });
    await fs.writeFile(romPath, "ROM");

    await exportWebBuild({
      project: {
        ...dummyProjectResources,
        settings: {
          ...dummyProjectResources.settings,
          webTemplate: "local",
        },
      },
      projectRoot,
      destination,
      romFilename: "game.gb",
      romPath,
      warnings: warn,
    });

    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.toContain("default-template");
    expect(warn).toHaveBeenCalledWith(
      'Web template "local-template" contains unsafe output paths, using default template.',
    );
  });

  it("uses the default template when webTemplate is overridden with an empty string", async () => {
    const projectRoot = Path.join(testRoot, "project");
    const destination = Path.join(testRoot, "dist");
    const romPath = Path.join(testRoot, "game.gb");
    const templateRoot = Path.join(projectRoot, "assets", "web", "local");
    await writeWebTemplate(templateRoot, "local-template");
    await fs.writeFile(romPath, "ROM");

    await exportWebBuild({
      project: {
        ...dummyProjectResources,
        settings: {
          ...dummyProjectResources.settings,
          webTemplate: "local",
        },
      },
      projectRoot,
      destination,
      romFilename: "game.gb",
      romPath,
      webTemplate: "",
      warnings: warnings(),
    });

    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.toContain("default-template");
    await expect(
      fs.readFile(Path.join(destination, "index.html"), "utf8"),
    ).resolves.not.toContain("local-template");
  });
});
