export const wrap8Bit = val => (256 + (val % 256)) % 256;
export const wrap16Bit = val => (65536 + (val % 65536)) % 65536;

export const decBin = dec =>
  wrap8Bit(dec)
    .toString(2)
    .padStart(8, "0");

export const decHex = dec =>
  `0x${wrap8Bit(dec)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()}`;

export const decHexVal = dec =>
  wrap8Bit(dec)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();

export const decHex16 = dec =>
  `0x${wrap16Bit(dec)
    .toString(16)
    .padStart(4, "0")
    .toUpperCase()}`;

export const decHex16Val = dec =>
  wrap16Bit(dec)
    .toString(16)
    .padStart(4, "0")
    .toUpperCase();

export const hexDec = hex => parseInt(hex, 16);

export const hi = longNum => wrap16Bit(longNum) >> 8;

export const lo = longNum => wrap16Bit(longNum) % 256;

export const signed8BitVal = dec => dec >= 0
    ? dec & 0x7F
    : 0x80 + (0x80 - (Math.abs(dec) & 0x7F))

export const divisibleBy8 = n => (n >> 3) << 3 === n;

export const convertHexTo15BitDec = hex => {
  const r = Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
  const g = Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
  const b = Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));
  return (b<<10) + (g<<5) + r;
};
