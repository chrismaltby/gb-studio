import glob from "glob";
import Path from "path";
import { promisify } from "util";
import uuid from "uuid/v4";
import sizeOf from "image-size";

const TILE_SIZE = 8;

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);

const loadBackgroundData = projectRoot => async filename => {
  const size = await sizeOfAsync(filename);
  const relativePath = filename.replace(projectRoot, "");
  const plugin = relativePath.startsWith("/plugin")
    ? relativePath.replace(/\/plugins\/([^/]*)\/.*/, "$1")
    : undefined;
  const file = plugin
    ? relativePath.replace(`/plugins/${plugin}/backgrounds/`, "")
    : relativePath.replace("/assets/backgrounds/", "");

  return {
    id: uuid(),
    plugin,
    name: file.replace(".png", ""),
    width: Math.min(Math.floor(size.width / TILE_SIZE), 32),
    height: Math.min(Math.floor(size.height / TILE_SIZE), 32),
    imageWidth: size.width,
    imageHeight: size.height,
    filename: file,
    _v: Date.now()
  };
};

const loadAllBackgroundData = async projectRoot => {
  const imagePaths = await globAsync(
    `${projectRoot}/assets/backgrounds/**/*.png`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/backgrounds/**/*.png`
  );
  const imageData = await Promise.all(
    [].concat(
      imagePaths.map(loadBackgroundData(projectRoot)),
      pluginPaths.map(loadBackgroundData(projectRoot))
    )
  );
  return imageData;
};

export default loadAllBackgroundData;
export { loadBackgroundData };
