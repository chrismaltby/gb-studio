import fs from "fs-extra";
import os from "os";
import getTmp from "lib/helpers/getTmp";
import { getGlobalPluginsPath } from "lib/pluginManager/globalPlugins";
import createProject, {
  shouldIgnoreTemplatePath,
} from "lib/project/createProject";
import path, { dirname, join } from "path";
import { rimraf as rmdir } from "rimraf";

jest.mock("lib/pluginManager/globalPlugins", () => ({
  getGlobalPluginsPath: jest.fn(),
}));

const mockGetGlobalPluginsPath = jest.mocked(getGlobalPluginsPath);

describe("createProject", () => {
  let testRoot: string;
  let writePath: string;
  let globalPluginsPath: string;

  beforeAll(async () => {
    const tmpDir = await getTmp();

    testRoot = await fs.mkdtemp(join(tmpDir, "create-project-test-"));
    writePath = join(testRoot, "test-projects");
    globalPluginsPath = join(testRoot, "global-plugins");

    mockGetGlobalPluginsPath.mockReturnValue(globalPluginsPath);
    await fs.ensureDir(globalPluginsPath);
  });

  beforeEach(async () => {
    await rmdir(writePath);
    await rmdir(globalPluginsPath);
    await fs.ensureDir(globalPluginsPath);
  });

  afterAll(async () => {
    await rmdir(testRoot);
  });

  test("can create a project named 'project'", async () => {
    const projectPath = await createProject({
      name: "project",
      template: "gbhtml",
      path: writePath,
    });

    expect(path.basename(projectPath)).toBe("project.gbsproj");
    expect(await fs.pathExists(projectPath)).toBe(true);
  });

  test("overwrites metadata from a project template plugin", async () => {
    const templateDirectory = join(globalPluginsPath, "my-template");
    const templateProjectPath = join(templateDirectory, "project.gbsproj");

    await fs.ensureDir(templateDirectory);
    await fs.writeJSON(
      templateProjectPath,
      {
        _resourceType: "project",
        name: "My Template",
        author: "Template Author",
        notes: "Keep this note",
        _version: "4.3.2",
        _release: "1",
      },
      { spaces: 2 },
    );

    await fs.writeFile(
      join(templateDirectory, "template-file.txt"),
      "Template content",
    );

    const projectPath = await createProject({
      name: "My New Game",
      template: join("my-template", "project.gbsproj"),
      path: writePath,
    });

    const projectRoot = dirname(projectPath);
    const metadata = await fs.readJSON(projectPath);

    expect(path.basename(projectPath)).toBe("My New Game.gbsproj");

    expect(metadata).toEqual({
      _resourceType: "project",
      name: "My New Game",
      author: os.userInfo().username,
      notes: "Keep this note",
      _version: "4.3.2",
      _release: "1",
    });

    expect(await fs.pathExists(join(projectRoot, "project.gbsproj"))).toBe(
      false,
    );
    expect(await fs.pathExists(join(projectRoot, "template-file.txt"))).toBe(
      true,
    );
  });

  test("does not create a project for invalid plugin metadata", async () => {
    const templateDirectory = join(globalPluginsPath, "invalid-template");

    await fs.ensureDir(templateDirectory);
    await fs.writeJSON(join(templateDirectory, "project.gbsproj"), {
      _resourceType: "project",
      name: 123,
      author: "Template Author",
    });

    const projectRoot = join(writePath, "Invalid Project");

    await expect(
      createProject({
        name: "Invalid Project",
        template: join("invalid-template", "project.gbsproj"),
        path: writePath,
      }),
    ).rejects.toThrow("Template project.gbsproj is invalid");

    expect(await fs.pathExists(projectRoot)).toBe(false);
  });
});

describe("shouldIgnoreTemplatePath", () => {
  const templatePath = path.join(
    path.parse(process.cwd()).root,
    "templates",
    "example",
  );
  const shouldIgnore = shouldIgnoreTemplatePath(templatePath);

  test.each([
    ["root thumbnail", "thumbnail.png", true],
    ["uppercase root thumbnail", "THUMBNAIL.PNG", true],
    ["mixed-case root thumbnail", "Thumbnail.Png", true],

    ["nested thumbnail", "assets/backgrounds/thumbnail.png", false],
    ["nested uppercase thumbnail", "assets/THUMBNAIL.PNG", false],
    ["similar thumbnail filename", "project-thumbnail.png", false],
    ["different thumbnail extension", "thumbnail.jpg", false],

    ["root plugin metadata", "plugin.json", true],
    ["uppercase root plugin metadata", "PLUGIN.JSON", true],
    ["mixed-case root plugin metadata", "Plugin.Json", true],

    ["nested plugin metadata", "assets/plugin.json", false],
    ["nested uppercase plugin metadata", "assets/PLUGIN.JSON", false],
    ["similar plugin metadata filename", "my-plugin.json", false],
    ["plugin metadata with backup extension", "plugin.json.bak", true],
    ["different plugin metadata extension", "plugin.js", false],

    ["root backup", "project.gbsproj.bak", true],
    ["uppercase backup extension", "project.gbsproj.BAK", true],
    ["nested backup", "assets/backgrounds/map.png.bak", true],
    ["backup directory", "assets-old.bak", true],

    ["bak before another extension", "project.gbsproj.bak.tmp", false],
    ["bak within filename", "project.bak.json", false],
    ["normal project file", "project.gbsproj", false],
    ["template directory itself", ".", false],
  ])("%s", (_description, relativePath, expected) => {
    expect(shouldIgnore(path.resolve(templatePath, relativePath))).toBe(
      expected,
    );
  });
});
