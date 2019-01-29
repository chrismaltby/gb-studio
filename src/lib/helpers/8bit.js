const wrap8Bit = val => (256 + (val % 256)) % 256;

export const decBin = dec =>
  wrap8Bit(dec)
    .toString(2)
    .padStart(8, "0");

export const decHex = dec =>
  "0x" +
  wrap8Bit(dec)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
