import { glob } from "lib/helpers/glob";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { MusicResource, MusicResourceAsset } from "shared/lib/resources/types";
import { getAssetResource } from "./assets";
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
  const musicPaths = await glob("assets/music/**/@(*.mod|*.MOD|*.uge|*.UGE)", {
    cwd: projectRoot,
    absolute: true,
  });
  const pluginPaths = await glob(
    "plugins/*/**/music/**/@(*.mod|*.MOD|*.uge|*.UGE)",
    {
      cwd: projectRoot,
      absolute: true,
    },
  );
  const musicData = await Promise.all(
    ([] as Promise<MusicResourceAsset>[]).concat(
      musicPaths.map(loadMusicData(projectRoot)),
      pluginPaths.map(loadMusicData(projectRoot)),
    ),
  );
  return musicData;
};

export default loadAllMusicData;
export { loadMusicData };
