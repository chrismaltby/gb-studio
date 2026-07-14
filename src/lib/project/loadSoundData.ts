import { glob } from "lib/helpers/glob";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { stat } from "fs";
import parseAssetPath from "shared/lib/assets/parseAssetPath";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import { readFXHammerNumEffects } from "lib/compiler/sounds/compileFXHammer";
import { getAssetResource } from "./assets";
import { SoundResource, SoundResourceAsset } from "shared/lib/resources/types";
const statAsync = promisify(stat);

type SoundAssetType = "wav" | "vgm" | "fxhammer";

const toVGMType = (filename: string): SoundAssetType => {
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
      _v: Date.now(),
      ...resource,
      filename: file,
      inode,
      numEffects,
    };
  };

const loadAllSoundData = async (projectRoot: string) => {
  const soundPaths = await glob(
    "assets/sounds/**/@(*.vgm|*.VGM|*.vgz|*.VGZ|*.wav|*.WAV|*.sav|*.SAV)",
    {
      cwd: projectRoot,
      absolute: true,
    },
  );
  const pluginPaths = await glob(
    "plugins/*/**/sounds/**/@(*.vgm|*.VGM|*.vgz|*.VGZ|*.wav|*.WAV|*.sav|*.SAV)",
    {
      cwd: projectRoot,
      absolute: true,
    },
  );
  const soundsData = await Promise.all(
    ([] as Promise<SoundResourceAsset>[]).concat(
      soundPaths.map(loadSoundData(projectRoot)),
      pluginPaths.map(loadSoundData(projectRoot)),
    ),
  );
  return soundsData;
};

export default loadAllSoundData;
export { loadSoundData };
