import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { MusicResource, MusicResourceAsset } from "shared/lib/resources/types";
import { getAssetResource } from "./assets";

const globAsync = promisify(glob);
const statAsync = promisify(stat);

const loadMusicData =
  (projectRoot: string) =>
  async (filename: string): Promise<MusicResourceAsset> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "music");
    const resource = await getAssetResource(MusicResource, filename);
    const fileStat = await statAsync(filename, { bigint: true });
    const inode = fileStat.ino.toString();
    const name = file.replace(/(.mod|.uge)$/i, "");
    return {
      _resourceType: "music",
      id: uuidv4(),
      plugin,
      name,
      symbol: toValidSymbol(`song_${name}`),
      settings: {},
      _v: Date.now(),
      ...resource,
      filename: file,
      type: file.endsWith(".uge") ? "uge" : "mod",
      inode,
    };
  };

const loadAllMusicData = async (projectRoot: string) => {
  const musicPaths = await globAsync(
    `${projectRoot}/assets/music/**/@(*.mod|*.MOD|*.uge|*.UGE)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/**/music/**/@(*.mod|*.MOD|*.uge|*.UGE)`
  );
  const musicData = await Promise.all(
    ([] as Promise<MusicResourceAsset>[]).concat(
      musicPaths.map(loadMusicData(projectRoot)),
      pluginPaths.map(loadMusicData(projectRoot))
    )
  );
  return musicData;
};

export default loadAllMusicData;
export { loadMusicData };
