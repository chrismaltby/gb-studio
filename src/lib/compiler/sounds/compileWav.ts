import { readFile } from "fs-extra";
import { decHex } from "lib/helpers/8bit";
import clamp from "lib/helpers/clamp";
import { WaveFile } from "wavefile";
import { CompiledSound } from "./compileSound";

type WaveFileFmt = {
  numChannels: number;
  bitsPerSample: number;
  sampleRate: number;
};

export const compileWav = async (
  filename: string,
  symbol: string
): Promise<CompiledSound> => {
  const file = await readFile(filename);

  let wav = new WaveFile(file);

  let wavFmt = wav.fmt as WaveFileFmt;

  // const isUncompressed = (p.comptype == 'NONE')
  const isUncompressed = true;

  // Resample is sample rate is wrong
  if (wavFmt.sampleRate < 8000 || wavFmt.sampleRate > 8192) {
    wav.toSampleRate(8000);
    wavFmt = wav.fmt as WaveFileFmt;
  }

  if (
    // wavFmt.numChannels !== 1 ||
    // wavFmt.bitsPerSample !== 8 ||
    wavFmt.sampleRate < 8000 ||
    wavFmt.sampleRate > 8192 ||
    !isUncompressed
  ) {
    throw new Error("Unsupport wav");
  }

  let result = "";
  let output = "";
  //   const rawData: Float64Array = wav.getSamples(true);
  let data: Float64Array = wav.getSamples(true);

  // Merge multi channel wavs
  if (wavFmt.numChannels > 1) {
    const newLength = Math.floor(data.length / wavFmt.numChannels);
    const newData = new Float64Array(newLength);
    let ii = 0;
    for (let i = 0; i < newLength; i++) {
      let newVal = 0;
      for (let j = 0; j < wavFmt.numChannels; j++) {
        newVal += data[ii + j] / wavFmt.numChannels;
      }
      newData[i] = clamp(Math.round(newVal), 0, 255);
      ii += wavFmt.numChannels;
    }
    data = newData;
  }

  const dataLength = data.length - (data.length % 32);
  let c = 0;
  let cnt = 0;
  let flag = false;

  for (let i = 0; i < dataLength; i++) {
    //
    c = ((c << 4) | (data[i] >> 4)) & 0xff;
    if (flag) {
      result += decHex(c); //sEMIT.format(c);
      cnt += 1;
      if (cnt % 16 === 0) {
        result = `1,0b00000110,${result},\n`;
        // outf.write(bytes(result, "ascii"));
        output += result;
        result = "";
      } else {
        result += ",";
      }
    }
    flag = !flag;
  }

  return {
    src: `#pragma bank 255

    #include <gbdk/platform.h>
    #include <stdint.h>
    
    BANKREF(${symbol})
    const UINT8 ${symbol}[] = {
    ${output}
    1,0b00000111
    };
    void AT(0b00000100) __mute_mask_${symbol};
    `,
    header: `#ifndef __${symbol}_INCLUDE__
    #define __${symbol}_INCLUDE__
    
    #include <gbdk/platform.h>
    #include <stdint.h>
    
    #define MUTE_MASK_${symbol} 0b00000100
    
    BANKREF_EXTERN(${symbol})
    extern const uint8_t ${symbol}[];
    extern void __mute_mask_${symbol};
    
    #endif
    `,
  };
};
