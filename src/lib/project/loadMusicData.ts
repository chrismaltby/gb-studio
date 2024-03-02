import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import type { MusicSettings } from "store/features/entities/entitiesTypes";

const globAsync = promisify(glob);
const statAsync = promisify(stat);

interface MusicAssetData {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  plugin?: string;
  settings: MusicSettings;
  type?: string;
  inode: string;
  _v: number;
}

const loadMusicData =
  (projectRoot: string) =>
  async (filename: string): Promise<MusicAssetData> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "music");
    const fileStat = await statAsync(filename, { bigint: true });
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

const loadAllMusicData = async (projectRoot: string) => {
  const musicPaths = await globAsync(
    `${projectRoot}/assets/music/**/@(*.mod|*.MOD|*.uge|*.UGE)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/music/**/@(*.mod|*.MOD|*.uge|*.UGE)`
  );
  const musicData = await Promise.all(
    ([] as Promise<MusicAssetData>[]).concat(
      musicPaths.map(loadMusicData(projectRoot)),
      pluginPaths.map(loadMusicData(projectRoot))
    )
  );
  return musicData;
};

export default loadAllMusicData;
export { loadMusicData };
