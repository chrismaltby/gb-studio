export const SIGNED_16BIT_MAX = 32767;
export const SIGNED_16BIT_MIN = -32768;

export const wrap8Bit = (val: number) => (256 + (val % 256)) % 256;
export const wrap16Bit = (val: number) => (65536 + (val % 65536)) % 65536;

export const wrapSigned8Bit = (val: number) => {
  const u = wrap8Bit(val);
  return u >= 128 ? u - 256 : u;
};

export const clampSigned16Bit = (val: number) =>
  Math.max(SIGNED_16BIT_MIN, Math.min(SIGNED_16BIT_MAX, val));
export const wrap32Bit = (val: number) =>
  (4294967296 + (val % 4294967296)) % 4294967296;

export const decBin = (dec: number) =>
  wrap8Bit(dec).toString(2).padStart(8, "0");

export const decHex = (dec: number) =>
  `0x${wrap8Bit(dec).toString(16).padStart(2, "0").toUpperCase()}`;

export const decHexVal = (dec: number) =>
  wrap8Bit(dec).toString(16).padStart(2, "0").toUpperCase();

export const decHex16 = (dec: number) =>
  `0x${wrap16Bit(dec).toString(16).padStart(4, "0").toUpperCase()}`;

export const decHex16Val = (dec: number) =>
  wrap16Bit(dec).toString(16).padStart(4, "0").toUpperCase();

export const decHex32Val = (dec: number) =>
  wrap32Bit(dec).toString(16).padStart(8, "0").toUpperCase();

export const decOct = (dec: number) =>
  wrap8Bit(dec).toString(8).padStart(3, "0");

export const hexDec = (hex: string) => parseInt(hex, 16);

export const hi = (longNum: number) => wrap16Bit(longNum) >> 8;

export const lo = (longNum: number) => wrap16Bit(longNum) % 256;

export const fromSigned8Bit = (num: number): number => {
  const masked = num & 0xff;
  if (masked & 0x80) {
    return masked - 0x100;
  } else {
    return masked;
  }
};

export const divisibleBy8 = (n: number) => (n >> 3) << 3 === n;

export const convertHexTo15BitDec = (hex: string) => {
  const r = Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
  const g = Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
  const b = Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));
  return (b << 10) + (g << 5) + r;
};

export const roundDown8 = (v: number): number => 8 * Math.floor(v / 8);
export const roundDown16 = (v: number): number => 16 * Math.floor(v / 16);

export const roundUp16 = (x: number): number => Math.ceil(x / 16) * 16;
export const roundUp8 = (x: number): number => Math.ceil(x / 8) * 8;
