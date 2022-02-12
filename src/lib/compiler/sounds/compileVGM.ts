import { readFile } from "fs-extra";
import { decBin, decHex } from "lib/helpers/8bit";
import { CompiledSound } from "./compileSound";
import { ungzip } from "node-gzip";

const MIN_VGM_VERSION = 0x161;

interface VGMOptions {
  delay: number;
  noInit?: boolean;
  noNR1X?: boolean;
  noNR2X?: boolean;
  noNR3X?: boolean;
  noNR4X?: boolean;
  noNR5X?: boolean;
  noWave?: boolean;
}

export const compileVGM = async (
  filename: string,
  symbol: string
): Promise<CompiledSound> => {
  const options: VGMOptions = {
    delay: 0,
  };
  const disabledChannels = new Set<number>();

  if (options.noNR1X) {
    disabledChannels.add(0);
  } else if (options.noNR2X) {
    disabledChannels.add(1);
  } else if (options.noNR3X) {
    disabledChannels.add(2);
  } else if (options.noNR4X) {
    disabledChannels.add(3);
  }

  let file = await readFile(filename);

  if (filename.toLowerCase().endsWith(".vgz")) {
    file = await ungzip(file);
  }

  let ptr = 0;
  const read = () => {
    const data = file[ptr];
    ptr++;
    return data;
  };
  const readSlice = (size: number) => {
    const data = [...file.slice(ptr, ptr + size)];
    ptr += size;
    return data;
  };
  const seek = (offset: number, whence = 0) => {
    if (whence === 0) {
      ptr = offset;
    } else if (whence === 1) {
      ptr += offset;
    }
  };

  let channelMuteMask = 0;
  if (unpackString(readSlice(4)) !== "Vgm ") {
    throw new Error("Invalid file format");
  }

  seek(0x08);
  const vgmVersion = unpackInt(readSlice(4));

  if (vgmVersion < MIN_VGM_VERSION) {
    throw new Error("VGM version too low");
  }
  if (vgmVersion === 0) {
    throw new Error("VGM must contain GB data");
  }

  seek(0x34);
  const offset = unpackInt(readSlice(4));

  seek(offset - 4, 1);

  let data = read();

  let output = "";
  let row: Record<number, Record<number, number>> = {};
  while (data) {
    if (data === 0x66) {
      output += `1,0b${decBin(7)}`;
      break;
    } else if (data === 0xb3) {
      let addr = read();
      const data = read();
      addr += 0x10;
      if (inRange(addr, 0x10, 0x16)) {
        setDefault(row, 0, {})[addr - 0x10] = data;
      } else if (inRange(addr, 0x16, 0x20)) {
        setDefault(row, 1, {})[addr - 0x15] = data;
      } else if (inRange(addr, 0x1a, 0x1f)) {
        setDefault(row, 2, {})[addr - 0x1a] = data;
      } else if (inRange(addr, 0x20, 0x24)) {
        setDefault(row, 3, {})[addr - 0x1f] = data;
      } else if (inRange(addr, 0x24, 0x27)) {
        setDefault(row, 4, {})[addr - 0x24] = data;
      } else if (inRange(addr, 0x30, 0x40)) {
        setDefault(row, 5, {})[addr - 0x30] = data;
      } else {
        throw new Error(`Invalid register address: ${addr}`);
      }
    } else if (
      data === 0x61 ||
      data === 0x62 ||
      (data >= 0x70 && data <= 0x7f)
    ) {
      let delay = 0;
      if (data === 0x61) {
        const n = unpackInt(readSlice(2));
        const frames = Math.round((n / 65535) * 90);
        delay += frames;
      }
      if (data >= 0x70 && data <= 0x7f) {
        delay += data - 0x6f;
      }

      let result = "";
      let count = 0;

      // NR5x regs:
      let ch = pop(row, 4);
      if (ch !== undefined && !options.noNR5X) {
        let val = pop(ch, 3) ?? -1;
        if (val !== -1 && !options.noInit) {
          count += 1;
          result += `0b00100100,${decHex(val)},`;
        }
        let mask = 4;
        let tmp = "";
        for (let i = 0; i < 2; i++) {
          val = pop(ch, i) ?? -1;
          if (val !== -1) {
            mask |= 1 << (7 - i);
            tmp += `${decHex(val)},`;
          }
        }
        if (mask !== 4) {
          count += 1;
          result += `0b${decBin(mask)},${tmp}`;
        }
      }

      // AUD3WAVE[]
      ch = pop(row, 5);
      if (ch !== undefined && !options.noWave) {
        const mask = 5;
        let tmp = "";
        for (let i = 0; i < 16; i++) {
          const val = pop(ch, i) ?? 0;
          tmp += `${decHex(val)},`;
        }
        count += 1;
        result += `0b${decBin(mask)},${tmp}`;
      }

      //  NR1x, NR2x, NR3x, NR4x regs
      for (let j = 0; j < 4; j++) {
        ch = pop(row, j);
        if (ch !== undefined && !disabledChannels.has(j)) {
          let mask = j;
          let tmp = "";
          for (let i = 0; i < 5; i++) {
            const val = pop(ch, i) ?? -1;
            if (val !== -1) {
              mask |= 1 << (7 - i);
              tmp += `${decHex(val)},`;
            }
          }
          if (mask !== j && (mask & 0b00001000) !== 0) {
            count += 1;
            result += `0b${decBin(mask)},${tmp}`;
            channelMuteMask |= 1 << j;
          }
        }
      }

      //optional delay
      count |= Math.max(0, options.delay + delay - 1) << 4;

      // output result
      result = `${decHex(count)},${result}\n`;

      output += result;

      row = {};
    } else {
      throw new Error(`Unsupported command ${decHex(data)}`);
    }

    data = read();
  }

  return {
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
    src: `#pragma bank 255

#include <gbdk/platform.h>
#include <stdint.h>

BANKREF(${symbol})
const uint8_t ${symbol}[] = {
${output}
};
void AT(0b${decBin(channelMuteMask)}) __mute_mask_${symbol};
  `,
  };
};

const unpackString = (data: number[]): string => {
  return data.map((c) => String.fromCharCode(c)).join("");
};

const unpackInt = (data: number[]): number => {
  // Little endian
  let value = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    value <<= 8;
    value += data[i];
  }
  return value;
};

const inRange = (val: number, min: number, max: number) => {
  return val >= min && val < max;
};

const setDefault = <T extends unknown, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
) => {
  if (obj[key] !== undefined) {
    return obj[key];
  }
  obj[key] = value;
  return value;
};

const pop = <T extends unknown, K extends keyof T>(obj: T, key: K) => {
  if (obj[key] !== undefined) {
    const value = obj[key];
    delete obj[key];
    return value;
  }
};

export const compileVGMHeader = (symbol: string) => {
  return `#ifndef __${symbol}_INCLUDE__
  #define __${symbol}_INCLUDE__
  
  #include <gbdk/platform.h>
  #include <stdint.h>
  
  #define MUTE_MASK_${symbol} 0b00000100
  
  BANKREF_EXTERN(${symbol})
  extern const uint8_t ${symbol}[];
  extern void __mute_mask_${symbol};
  
  #endif
  `;
};
