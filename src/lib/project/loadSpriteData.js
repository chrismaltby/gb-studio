import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import sizeOf from "image-size";
import Path from "path";
import { spriteTypeFromNumFrames } from "../helpers/gbstudio";

const FRAME_SIZE = 16;

const globAsync = promisify(glob);
const sizeOfAsync = promisify(sizeOf);

const loadSpriteData = projectRoot => async filename => {
  const size = await sizeOfAsync(filename);
  const numFrames = size.width / FRAME_SIZE;
  const relativePath = Path.relative(projectRoot, filename);
  const plugin = relativePath.startsWith("plugins")
    ? relativePath.split(Path.sep)[1]
    : undefined;
  const file = plugin
    ? Path.relative(`plugins/${plugin}/sprites/`, relativePath)
    : Path.relative("assets/sprites/", relativePath);
  return {
    id: uuidv4(),
    plugin,
    name: file.replace(".png", ""),
    numFrames,
    type: spriteTypeFromNumFrames(numFrames),
    filename: file,
    _v: Date.now()
  };
};

const loadAllSpriteData = async projectRoot => {
  const spritePaths = await globAsync(`${projectRoot}/assets/sprites/**/*.png`);
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/sprites/**/*.png`
  );
  const spriteData = await Promise.all(
    [].concat(
      spritePaths.map(loadSpriteData(projectRoot)),
      pluginPaths.map(loadSpriteData(projectRoot))
    )
  );
  return spriteData;
};

export default loadAllSpriteData;
export { loadSpriteData };
