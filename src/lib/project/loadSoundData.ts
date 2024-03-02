import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";

const globAsync = promisify(glob);
const statAsync = promisify(stat);

type SoundAssetType = "wav" | "vgm" | "fxhammer";

interface SoundAssetData {
  id: string;
  name: string;
  symbol: string;
  filename: string;
  plugin?: string;
  type: SoundAssetType;
  inode: string;
  _v: number;
}

export const toVGMType = (filename: string): SoundAssetType => {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith(".wav")) {
    return "wav";
  }
  if (lowerFilename.endsWith(".vgm") || lowerFilename.endsWith(".vgz")) {
    return "vgm";
  }
  if (lowerFilename.endsWith(".sav")) {
    return "fxhammer";
  }
  throw new Error("Unknown sound type");
};

const loadSoundData =
  (projectRoot: string) =>
  async (filename: string): Promise<SoundAssetData> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "sounds");
    const fileStat = await statAsync(filename, { bigint: true });
    const inode = fileStat.ino.toString();
    const type = toVGMType(filename);

    return {
      id: uuidv4(),
      plugin,
      name: file,
      symbol: toValidSymbol(`sound_${file}`),
      filename: file,
      type,
      inode,
      _v: Date.now(),
    };
  };

const loadAllSoundData = async (projectRoot: string) => {
  const soundPaths = await globAsync(
    `${projectRoot}/assets/sounds/**/@(*.vgm|*.VGM|*.vgz|*.VGZ|*.wav|*.WAV|*.sav|*.SAV)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/sounds/**/@(*.vgm|*.VGM|*.vgz|*.VGZ|*.wav|*.WAV|*.sav|*.SAV)`
  );
  const soundsData = await Promise.all(
    ([] as Promise<SoundAssetData>[]).concat(
      soundPaths.map(loadSoundData(projectRoot)),
      pluginPaths.map(loadSoundData(projectRoot))
    )
  );
  return soundsData;
};

export default loadAllSoundData;
export { loadSoundData };
