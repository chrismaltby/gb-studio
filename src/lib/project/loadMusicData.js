import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import { stat } from "fs-extra";
import parseAssetPath from "../helpers/path/parseAssetPath";
import { toValidSymbol } from "lib/helpers/symbols";

const globAsync = promisify(glob);

const loadMusicData = (projectRoot) => async (filename) => {
  const { file, plugin } = parseAssetPath(filename, projectRoot, "music");
  const fileStat = await stat(filename, { bigint: true });
  const inode = fileStat.ino.toString();
  const name = file.replace(/(.mod|.uge)/i, "");
  return {
    id: uuidv4(),
    plugin,
    name,
    symbol: toValidSymbol(`song_${name}`),
    filename: file,
    settings: {},
    type: file.endsWith(".uge") ? "uge" : "mod",
    inode,
    _v: Date.now(),
  };
};

const loadAllMusicData = async (projectRoot) => {
  const musicPaths = await globAsync(
    `${projectRoot}/assets/music/**/@(*.mod|*.MOD|*.uge|*.UGE)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/music/**/@(*.mod|*.MOD|*.uge|*.UGE)`
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
