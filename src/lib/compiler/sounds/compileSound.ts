import { decBin } from "shared/lib/helpers/8bit";
import type { SoundData } from "shared/lib/entities/entitiesTypes";
import { compileFXHammer } from "./compileFXHammer";
import { compileVGM } from "./compileVGM";
import { compileWav } from "./compileWav";
import { assetFilename } from "shared/lib/helpers/assets";

export interface CompileSoundOptions {
  projectRoot: string;
}

export interface CompiledSound {
  src: string;
  header: string;
}

const compileSoundFiles = async (
  rawData: string,
  muteMask: string,
  symbol: string,
): Promise<CompiledSound> => {
  return {
    src: `#pragma bank 255
  
  #include <gbdk/platform.h>
  #include <stdint.h>
  
  BANKREF(${symbol})
  const UINT8 ${symbol}[] = {
  ${rawData}
  };
  void AT(${muteMask}) __mute_mask_${symbol};
  `,
    header: `#ifndef __${symbol}_INCLUDE__
  #define __${symbol}_INCLUDE__
  
  #include <gbdk/platform.h>
  #include <stdint.h>
  
  #define MUTE_MASK_${symbol} ${muteMask}
  
  BANKREF_EXTERN(${symbol})
  extern const uint8_t ${symbol}[];
  extern void __mute_mask_${symbol};
  
  #endif
      `,
  };
};

export const compileSound = async (
  sound: SoundData,
  { projectRoot }: CompileSoundOptions,
): Promise<CompiledSound> => {
  const assetPath = assetFilename(projectRoot, "sounds", sound);

  if (sound.type === "wav") {
    const rawData = await compileWav(assetPath);
    return compileSoundFiles(rawData, "0b00000100", sound.symbol);
  } else if (sound.type === "vgm") {
    const rawData = await compileVGM(assetPath);
    return compileSoundFiles(
      rawData.output,
      `0b${decBin(rawData.channelMuteMask)}`,
      sound.symbol,
    );
  } else if (sound.type === "fxhammer") {
    return compileFXHammer(assetPath, sound.symbol);
  }

  throw new Error("Unknown sound file");
};
