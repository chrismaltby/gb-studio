import { readFile } from "fs-extra";
import { decHex, decBin } from "lib/helpers/8bit";
import { CompiledSound } from "./compileSound";

const noteFreqs = [
  44, 156, 262, 363, 457, 547, 631, 710, 786, 854, 923, 986, 1046, 1102, 1155,
  1205, 1253, 1297, 1339, 1379, 1417, 1452, 1486, 1517, 1546, 1575, 1602, 1627,
  1650, 1673, 1694, 1714, 1732, 1750, 1767, 1783, 1798, 1812, 1825, 1837, 1849,
  1860, 1871, 1881, 1890, 1899, 1907, 1915, 1923, 1930, 1936, 1943, 1949, 1954,
  1959, 1964, 1969, 1974, 1978, 1982, 1985, 1988, 1992, 1995, 1998, 2001, 2004,
  2006, 2009, 2011, 2013, 2015,
];

interface FXHammerOptions {
  delay: number;
  cutSound?: boolean;
  usePan?: boolean;
  optimize?: boolean;
}

const makeFrame = (
  ch: number,
  a: number,
  b: number,
  c: number,
  d: number,
  cache: number[]
) => {
  let mask = 0b01001000 | ch;
  let result = `,${decHex(a)}`;
  if (b !== cache[0]) {
    mask |= 0b00100000;
    result += `,${decHex(b)}`;
    cache[0] = b;
  }
  if (c !== cache[1]) {
    mask |= 0b00010000;
    result += `,${decHex(c)}`;
    cache[1] = c;
  }
  return `0b${decBin(mask)}${result},${decHex(d)}`;
};

const writeEffectData = (
  symbol: string,
  ch: number,
  data: Buffer,
  options: FXHammerOptions
) => {
  if (data.length !== 256) {
    throw new Error("Unexpected end of file");
  }

  const chMask = (ch & 0xf0 ? 0x02 : 0) | (ch & 0x0f ? 0x08 : 0);

  const ch2Cache = [-1, -1];
  const ch4Cache = [-1, -1];
  let oldPan = 0xff;
  let output = `BANKREF(${symbol})
const uint8_t ${symbol}[] = {
`;

  for (let i = 0; i < 32; i++) {
    const [
      duration,
      ch2pan,
      ch2vol,
      ch2duty,
      ch2note,
      ch4pan,
      ch4vol,
      ch4freq,
    ] = data.slice(i * 8, (i + 1) * 8);

    if (duration === 0) {
      break;
    }

    let result = "";
    let count = 0;

    if (options.usePan) {
      const currentPan = 0b01010101 | ch2pan | ch4pan;
      if (oldPan !== currentPan) {
        count += 1;
        result += `,0b01000100,${decHex(currentPan)}`;
        oldPan = currentPan;
      }
    }

    if (ch2pan !== 0) {
      count += 1;
      const freq = noteFreqs[(ch2note - 0x40) >> 1];
      if (options.optimize) {
        result += `,${makeFrame(
          1,
          ch2duty,
          ch2vol,
          freq & 0xff,
          ((freq >> 8) | 0x80) & 0xff,
          ch2Cache
        )}`;
      } else {
        result += `,0b01111001,${decHex(ch2duty)},${decHex(ch2vol)},${decHex(
          freq & 0xff
        )},${decHex(((freq >> 8) | 0x80) & 0xff)}`;
      }
    }

    if (ch4pan !== 0) {
      count += 1;
      if (options.optimize) {
        result += `,${makeFrame(3, 0x2a, ch4vol, ch4freq, 0x80, ch4Cache)}`;
      } else {
        result += `,0b01111011,0x2a,${decHex(ch4vol)},${decHex(ch4freq)},0x80`;
      }
    }

    let delay = Math.max(0, options.delay * duration - 1);
    let delta = Math.min(15, delay);

    output += `${decHex(((delta & 0x0f) << 4) | count)}${result},\n`;

    delay -= delta;
    while (delay > 0) {
      delta = Math.min(15, delay);
      output += `${decHex((delta & 0x0f) << 4)},\n`;
      delay -= delta;
    }
  }

  let count = 1;
  let result = "";
  if (options.cutSound) {
    if (chMask & 2) {
      count += 1;
      result += `0b00101001,${decHex(0)},${decHex(0xc0)}`;
    }
    if (chMask & 8) {
      count += 1;
      result += `0b00101011,${decHex(0)},${decHex(0xc0)}`;
    }
  }
  if (options.usePan) {
    count += 1;
    result += `0b01000100,${decHex(0xff)},`;
  }

  output += `${decHex(count)},${result}0b${decBin(7)}\n};\n`;
  output += `void AT(0b${decBin(chMask)}) __mute_mask_${symbol};\n\n`;

  return {
    src: output,
    header: `#define MUTE_MASK_${symbol} 0b${decBin(chMask)}
BANKREF_EXTERN(${symbol})
extern const uint8_t ${symbol}[];
extern void __mute_mask_${symbol};

`,
  };
};

export const compileFXHammer = async (
  filename: string,
  symbol: string
): Promise<CompiledSound> => {
  const options = {
    delay: 4,
    cutSound: true,
    usePan: true,
    optimize: true,
  };

  const file = await readFile(filename);

  if (unpackString(file.slice(0x9, 0x12)) !== "FX HAMMER") {
    throw new Error("Invalid file format");
  }

  let effectSrcs = "";
  let effectHeaders = "";

  for (let effectnum = 0; effectnum < 0x3c; effectnum++) {
    const channels = file[0x300 + effectnum];
    if (channels !== 0) {
      const { src: effectSrc, header: effectHeader } = writeEffectData(
        `${symbol}_${String(effectnum).padStart(2, "0")}`,
        channels,
        file.slice(0x400 + effectnum * 256, 0x400 + (effectnum + 1) * 256),
        options
      );
      effectSrcs += effectSrc;
      effectHeaders += effectHeader;
    }
  }

  return {
    src: `#pragma bank 255

#include <gbdk/platform.h>
#include <stdint.h>
    
${effectSrcs}`,
    header: `#ifndef __${symbol}_INCLUDE__
#define __${symbol}_INCLUDE__

#include <gbdk/platform.h>
#include <stdint.h>

${effectHeaders}
    
#endif
    `,
  };
};

const unpackString = (data: number[] | Buffer): string => {
  return [...data].map((c) => String.fromCharCode(c)).join("");
};
