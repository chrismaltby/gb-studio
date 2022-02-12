import { assetFilename } from "lib/helpers/gbstudio";
import { Sound } from "store/features/entities/entitiesTypes";
import { compileFXHammer } from "./compileFXHammer";
import { compileVGM } from "./compileVGM";
import { compileWav } from "./compileWav";

interface CompileSoundOptions {
  projectRoot: string;
}

export interface CompiledSound {
  src: string;
  header: string;
}

export const compileSound = (
  sound: Sound,
  { projectRoot }: CompileSoundOptions
): Promise<CompiledSound> => {
  const assetPath = assetFilename(projectRoot, "sounds", sound);

  if (sound.type === "wav") {
    return compileWav(assetPath, sound.symbol);
  } else if (sound.type === "vgm") {
    return compileVGM(assetPath, sound.symbol);
  } else if (sound.type === "fxhammer") {
    return compileFXHammer(assetPath, sound.symbol);
  }

  throw new Error("Unknown sound file");
};
