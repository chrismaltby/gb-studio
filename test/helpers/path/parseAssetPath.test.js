jest.mock("path");
import PathMock from "path";
import parseAssetPath from "../../../src/lib/helpers/path/parseAssetPath";
const PathActual = jest.requireActual("path");

test.only("Should parse posix asset paths", async () => {
  PathMock.relative = PathActual.posix.relative;
  PathMock.sep = PathActual.posix.sep;

  const projectRoot = "/home/test/projectname";
  const filename = "/home/test/projectname/assets/backgrounds/testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder
  );

  expect(plugin).toBe(undefined);
  expect(relativePath).toBe("assets/backgrounds/testing.png");
  expect(file).toBe("testing.png");
});

test.only("Should parse win32 asset paths", async () => {
  PathMock.relative = PathActual.win32.relative;
  PathMock.sep = PathActual.win32.sep;

  const projectRoot = "C:\\home\\test\\projectname";
  const filename =
    "C:\\home\\test\\projectname\\assets\\backgrounds\\testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder
  );

  expect(plugin).toBe(undefined);
  expect(relativePath).toBe("assets\\backgrounds\\testing.png");
  expect(file).toBe("testing.png");
});

test.only("Should parse posix plugin paths", async () => {
  PathMock.relative = PathActual.posix.relative;
  PathMock.sep = PathActual.posix.sep;

  const projectRoot = "/home/test/projectname";
  const filename =
    "/home/test/projectname/plugins/myplugin/backgrounds/testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder
  );

  expect(plugin).toBe("myplugin");
  expect(relativePath).toBe("plugins/myplugin/backgrounds/testing.png");
  expect(file).toBe("testing.png");
});

test.only("Should parse win32 plugin paths", async () => {
  PathMock.relative = PathActual.win32.relative;
  PathMock.sep = PathActual.win32.sep;

  const projectRoot = "C:\\home\\test\\projectname";
  const filename =
    "C:\\home\\test\\projectname\\plugins\\myplugin\\backgrounds\\testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder
  );

  expect(plugin).toBe("myplugin");
  expect(relativePath).toBe("plugins\\myplugin\\backgrounds\\testing.png");
  expect(file).toBe("testing.png");
});
