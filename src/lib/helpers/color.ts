const hexStringToDecimal = (str: string) => {
  return parseInt(str, 16);
};

const clamp = (value:number, min:number, max:number) => {
  return Math.min(max, Math.max(min, value));
};

const clamp31 = (value:number) => {
  return clamp(value, 0, 31);
};

export const hex2rgb = (hex: string) => {
  const r = Math.floor(hexStringToDecimal(hex.substring(0, 2)));
  const g = Math.floor(hexStringToDecimal(hex.substring(2, 4)));
  const b = Math.floor(hexStringToDecimal(hex.substring(4)));
  return {
    r, g, b
  }
};

export const hex2GBCrgb = (hex: string) => {
  const gbcHex = hex2GBChex(hex);
  const r = Math.floor(hexStringToDecimal(gbcHex.substring(0, 2)));
  const g = Math.floor(hexStringToDecimal(gbcHex.substring(2, 4)));
  const b = Math.floor(hexStringToDecimal(gbcHex.substring(4)));
  return {
    r, g, b
  }
};

export const hex2GBChex = (hex: string): string => {
  const r = clamp31(Math.floor(hexStringToDecimal(hex.substring(0, 2)) / 8));
  const g = clamp31(Math.floor(hexStringToDecimal(hex.substring(2, 4)) / 8));
  const b = clamp31(Math.floor(hexStringToDecimal(hex.substring(4)) / 8));
  return rgb5BitToGBCHex(r, g, b).toUpperCase();
};

/* 5-bit rgb value => GBC representative hex value */
export const rgb5BitToGBCHex = (red5:number, green5:number, blue5:number) => {
  const value = (blue5 << 10) + (green5 << 5) + red5;
  const r = value & 0x1f;
  const g = (value >> 5) & 0x1f;
  const b = (value >> 10) & 0x1f;
  return (
    (((r * 13 + g * 2 + b) >> 1) << 16) |
    ((g * 3 + b) << 9) |
    ((r * 3 + g * 2 + b * 11) >> 1)
  )
    .toString(16)
    .padStart(6, "0");
};
