import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import { stat } from "fs-extra";
import parseAssetPath from "../helpers/path/parseAssetPath";

const globAsync = promisify(glob);

const loadMusicData = projectRoot => async filename => {
  const { file, plugin } = parseAssetPath(filename, projectRoot, "music");
  const fileStat = await stat(filename, { bigint: true });
  const inode = fileStat.ino.toString();
  return {
    id: uuidv4(),
    plugin,
    name: file.replace(/.mod/i, ""),
    filename: file,
    settings: {},
    inode,
    _v: Date.now()
  };
};

const loadAllMusicData = async projectRoot => {
  const musicPaths = await globAsync(`${projectRoot}/assets/music/**/@(*.mod|*.MOD)`);
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/music/**/@(*.mod|*.MOD)`
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
