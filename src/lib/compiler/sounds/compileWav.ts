import { readFile } from "fs-extra";
import { decHexVal } from "shared/lib/helpers/8bit";
import clamp from "shared/lib/helpers/clamp";
import { WaveFile } from "wavefile";

type CompileOutputFmt = "c" | "asm";

type WaveFileFmt = {
  numChannels: number;
  bitsPerSample: number;
  sampleRate: number;
};

export const compileWav = async (
  filename: string,
  fmt: CompileOutputFmt = "c"
): Promise<string> => {
  const decHex = (v: number, fmt?: CompileOutputFmt) => {
    const prefix = fmt === "asm" ? "$" : "0x";
    return `${prefix}${decHexVal(v)}`;
  };
  const binPrefix = fmt === "asm" ? "%" : "0b";

  const file = await readFile(filename);

  const wav = new WaveFile(file);

  let wavFmt = wav.fmt as WaveFileFmt;

  // const isUncompressed = (p.comptype == 'NONE')
  const isUncompressed = true;

  // Resample is sample rate is wrong
  if (wavFmt.sampleRate < 8000 || wavFmt.sampleRate > 8192) {
    wav.toSampleRate(8000);
    wavFmt = wav.fmt as WaveFileFmt;
  }

  // Convert to 8bit if not already
  if (wavFmt.bitsPerSample !== 8) {
    wav.toBitDepth("8");
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

  let result = "";
  let output = "";

  const dataLength = data.length - (data.length % 32);
  let c = 0;
  let cnt = 0;
  let flag = false;

  for (let i = 0; i < dataLength; i++) {
    //
    c = ((c << 4) | (data[i] >> 4)) & 0xff;
    if (flag) {
      result += decHex(c, fmt); //sEMIT.format(c);
      cnt += 1;
      if (cnt % 16 === 0) {
        result = `${decHex(1, fmt)},${binPrefix}00000110,${result},`;
        // outf.write(bytes(result, "ascii"));
        if (fmt === "c") {
          result += "\n";
        }
        output += result;
        result = "";
      } else {
        result += ",";
      }
    }
    flag = !flag;
  }
  return `${output}${decHex(1, fmt)},${binPrefix}00000111`;
};
