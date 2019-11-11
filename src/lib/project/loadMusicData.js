import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import parseAssetPath from "../helpers/path/parseAssetPath";

const globAsync = promisify(glob);

const loadMusicData = projectRoot => async filename => {
  const { file, plugin } = parseAssetPath(filename, projectRoot, "music");

  return {
    id: uuidv4(),
    plugin,
    name: file.replace(".mod", ""),
    filename: file,
    _v: Date.now()
  };
};

const loadAllMusicData = async projectRoot => {
  const musicPaths = await globAsync(`${projectRoot}/assets/music/**/*.mod`);
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/music/**/*.mod`
  );
  const musicData = await Promise.all(
    [].concat(
      musicPaths.map(loadMusicData(projectRoot)),
      pluginPaths.map(loadMusicData(projectRoot))
    )
  );
  return musicData;
};

export default loadAllMusicData;
export { loadMusicData };
