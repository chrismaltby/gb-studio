import { existsSync } from "fs";
import getTmp from "lib/helpers/getTmp";
import createProject from "lib/project/createProject";
import { dirname, join } from "path";
import rimraf from "rimraf";
import { promisify } from "util";

const rmdir = promisify(rimraf);

describe("createProject", () => {
  const tmpDir = getTmp();
  const writePath = join(tmpDir, "test-projects");

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
