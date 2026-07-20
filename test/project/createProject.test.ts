import { existsSync } from "fs";
import getTmp from "lib/helpers/getTmp";
import createProject, {
  shouldIgnoreTemplatePath,
} from "lib/project/createProject";
import path, { dirname, join } from "path";
import { rimraf as rmdir } from "rimraf";

describe("createProject", () => {
  let writePath: string;

  beforeAll(async () => {
    const tmpDir = await getTmp();
    writePath = join(tmpDir, "test-projects");
  });

  afterAll(async () => {
    await rmdir(writePath);
  });

  test("can create a project named 'project'", async () => {
    const projectPath = await createProject({
      name: "project",
      template: "gbhtml",
      path: writePath,
    });
    const projectRoot = dirname(projectPath);
    expect(projectPath).toMatch(/.*project.gbsproj$/);
    expect(existsSync(projectPath)).toEqual(true);
    await rmdir(projectRoot);
    expect(existsSync(projectPath)).toEqual(false);
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
