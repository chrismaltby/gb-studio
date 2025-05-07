import glob from "glob";
import { promisify } from "util";
import uuidv4 from "uuid/v4";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { readFXHammerNumEffects } from "lib/compiler/sounds/compileFXHammer";
import { getAssetResource } from "./assets";
import { SoundResource, SoundResourceAsset } from "shared/lib/resources/types";

const globAsync = promisify(glob);
const statAsync = promisify(stat);

type SoundAssetType = "wav" | "vgm" | "fxhammer";

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
  async (filename: string): Promise<SoundResourceAsset> => {
    const { file, plugin } = parseAssetPath(filename, projectRoot, "sounds");
    const resource = await getAssetResource(SoundResource, filename);
    const fileStat = await statAsync(filename, { bigint: true });
    const inode = fileStat.ino.toString();
    const type = toVGMType(filename);
    const numEffects = await (type === "fxhammer"
      ? readFXHammerNumEffects(filename)
      : undefined);

    return {
      _resourceType: "sound",
      id: uuidv4(),
      plugin,
      name: file,
      symbol: toValidSymbol(`sound_${file}`),
      type,
      numEffects,
      _v: Date.now(),
      ...resource,
      filename: file,
      inode,
    };
  };

const loadAllSoundData = async (projectRoot: string) => {
  const soundPaths = await globAsync(
    `${projectRoot}/assets/sounds/**/@(*.vgm|*.VGM|*.vgz|*.VGZ|*.wav|*.WAV|*.sav|*.SAV)`
  );
  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/**/sounds/**/@(*.vgm|*.VGM|*.vgz|*.VGZ|*.wav|*.WAV|*.sav|*.SAV)`
  );
  const soundsData = await Promise.all(
    ([] as Promise<SoundResourceAsset>[]).concat(
      soundPaths.map(loadSoundData(projectRoot)),
      pluginPaths.map(loadSoundData(projectRoot))
    )
  );
  return soundsData;
};

export default loadAllSoundData;
export { loadSoundData };
