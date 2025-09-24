import {
  SIGNED_16BIT_MAX,
  SIGNED_16BIT_MIN,
  decBin,
  decHex,
  decHexVal,
  decHex16,
  decHex16Val,
  decHex32Val,
  decOct,
  hexDec,
  hi,
  lo,
  wrap8Bit,
  wrap16Bit,
  wrap32Bit,
  wrapSigned8Bit,
  clampSigned16Bit,
  fromSigned8Bit,
  divisibleBy8,
  convertHexTo15BitDec,
  roundDown8,
  roundDown16,
  roundUp8,
  roundUp16,
} from "shared/lib/helpers/8bit";

test("Should convert decimal to 8 bit binary", () => {
  expect(decBin(1)).toBe("00000001");
  expect(decBin(255)).toBe("11111111");
});

test("Should wrap overflowing values", () => {
  expect(decBin(256)).toBe("00000000");
  expect(decBin(257)).toBe("00000001");
});

test("Should wrap underflow values", () => {
  expect(decBin(-1)).toBe("11111111");
  expect(decBin(-2)).toBe("11111110");
  expect(decBin(-256)).toBe("00000000");
  expect(decBin(-257)).toBe("11111111");
});

test("Should convert decimal to 8 bit hex", () => {
  expect(decHex(0)).toBe("0x00");
  expect(decHex(1)).toBe("0x01");
  expect(decHex(255)).toBe("0xFF");
});

test("Should wrap overflowing values", () => {
  expect(decHex(256)).toBe("0x00");
  expect(decHex(257)).toBe("0x01");
});

test("Should wrap underflow values", () => {
  expect(decHex(-1)).toBe("0xFF");
  expect(decHex(-2)).toBe("0xFE");
  expect(decHex(-256)).toBe("0x00");
  expect(decHex(-257)).toBe("0xFF");
});

test("Should return lower bits of 16 bit num", () => {
  expect(lo(256)).toBe(0);
  expect(lo(257)).toBe(1);
  expect(lo(511)).toBe(255);
  expect(lo(1324)).toBe(44);
});

test("Should return higher bits of 16 bit num", () => {
  expect(hi(256)).toBe(1);
  expect(hi(257)).toBe(1);
  expect(hi(511)).toBe(1);
  expect(hi(1324)).toBe(5);
});

test("Should wrap when returning lower bits of 16 bit num", () => {
  expect(lo(-1)).toBe(255);
});

test("Should wrap when returning higher bits of 16 bit num", () => {
  expect(hi(-1)).toBe(255);
});

describe("wrapSigned8Bit", () => {
  test("Should keep values already in signed 8-bit range unchanged", () => {
    expect(wrapSigned8Bit(0)).toBe(0);
    expect(wrapSigned8Bit(1)).toBe(1);
    expect(wrapSigned8Bit(127)).toBe(127);
    expect(wrapSigned8Bit(-1)).toBe(-1);
    expect(wrapSigned8Bit(-128)).toBe(-128);
  });

  test("Should wrap values above 8-bit signed range", () => {
    expect(wrapSigned8Bit(128)).toBe(-128);
    expect(wrapSigned8Bit(255)).toBe(-1);
    expect(wrapSigned8Bit(496)).toBe(-16);
  });

  test("Should wrap values below 8-bit signed range", () => {
    expect(wrapSigned8Bit(-129)).toBe(127);
    expect(wrapSigned8Bit(-130)).toBe(126);
    expect(wrapSigned8Bit(-386)).toBe(126);
  });
});

describe("SIGNED_16BIT_MAX", () => {
  test("should be 32767", () => {
    expect(SIGNED_16BIT_MAX).toBe(32767);
  });
});

describe("SIGNED_16BIT_MIN", () => {
  test("should be -32768", () => {
    expect(SIGNED_16BIT_MIN).toBe(-32768);
  });
});

describe("wrap8Bit", () => {
  test("should keep values in 8-bit range unchanged", () => {
    expect(wrap8Bit(0)).toBe(0);
    expect(wrap8Bit(1)).toBe(1);
    expect(wrap8Bit(127)).toBe(127);
    expect(wrap8Bit(255)).toBe(255);
  });

  test("should wrap values above 8-bit range", () => {
    expect(wrap8Bit(256)).toBe(0);
    expect(wrap8Bit(257)).toBe(1);
    expect(wrap8Bit(511)).toBe(255);
    expect(wrap8Bit(512)).toBe(0);
  });

  test("should wrap negative values", () => {
    expect(wrap8Bit(-1)).toBe(255);
    expect(wrap8Bit(-2)).toBe(254);
    expect(wrap8Bit(-256)).toBe(0);
    expect(wrap8Bit(-257)).toBe(255);
  });
});

describe("wrap16Bit", () => {
  test("should keep values in 16-bit range unchanged", () => {
    expect(wrap16Bit(0)).toBe(0);
    expect(wrap16Bit(1)).toBe(1);
    expect(wrap16Bit(32767)).toBe(32767);
    expect(wrap16Bit(65535)).toBe(65535);
  });

  test("should wrap values above 16-bit range", () => {
    expect(wrap16Bit(65536)).toBe(0);
    expect(wrap16Bit(65537)).toBe(1);
    expect(wrap16Bit(131071)).toBe(65535);
    expect(wrap16Bit(131072)).toBe(0);
  });

  test("should wrap negative values", () => {
    expect(wrap16Bit(-1)).toBe(65535);
    expect(wrap16Bit(-2)).toBe(65534);
    expect(wrap16Bit(-65536)).toBe(0);
    expect(wrap16Bit(-65537)).toBe(65535);
  });
});

describe("wrap32Bit", () => {
  test("should keep values in 32-bit range unchanged", () => {
    expect(wrap32Bit(0)).toBe(0);
    expect(wrap32Bit(1)).toBe(1);
    expect(wrap32Bit(2147483647)).toBe(2147483647);
    expect(wrap32Bit(4294967295)).toBe(4294967295);
  });

  test("should wrap values above 32-bit range", () => {
    expect(wrap32Bit(4294967296)).toBe(0);
    expect(wrap32Bit(4294967297)).toBe(1);
  });

  test("should wrap negative values", () => {
    expect(wrap32Bit(-1)).toBe(4294967295);
    expect(wrap32Bit(-2)).toBe(4294967294);
  });
});

describe("clampSigned16Bit", () => {
  test("should keep values in signed 16-bit range unchanged", () => {
    expect(clampSigned16Bit(0)).toBe(0);
    expect(clampSigned16Bit(1)).toBe(1);
    expect(clampSigned16Bit(-1)).toBe(-1);
    expect(clampSigned16Bit(32767)).toBe(32767);
    expect(clampSigned16Bit(-32768)).toBe(-32768);
  });

  test("should clamp values above signed 16-bit range", () => {
    expect(clampSigned16Bit(32768)).toBe(32767);
    expect(clampSigned16Bit(65536)).toBe(32767);
    expect(clampSigned16Bit(100000)).toBe(32767);
  });

  test("should clamp values below signed 16-bit range", () => {
    expect(clampSigned16Bit(-32769)).toBe(-32768);
    expect(clampSigned16Bit(-65536)).toBe(-32768);
    expect(clampSigned16Bit(-100000)).toBe(-32768);
  });
});

describe("decHexVal", () => {
  test("should convert decimal to 8-bit hex value without prefix", () => {
    expect(decHexVal(0)).toBe("00");
    expect(decHexVal(1)).toBe("01");
    expect(decHexVal(15)).toBe("0F");
    expect(decHexVal(255)).toBe("FF");
  });

  test("should wrap values outside 8-bit range", () => {
    expect(decHexVal(256)).toBe("00");
    expect(decHexVal(257)).toBe("01");
    expect(decHexVal(-1)).toBe("FF");
    expect(decHexVal(-2)).toBe("FE");
  });
});

describe("decHex16", () => {
  test("should convert decimal to 16-bit hex with prefix", () => {
    expect(decHex16(0)).toBe("0x0000");
    expect(decHex16(1)).toBe("0x0001");
    expect(decHex16(255)).toBe("0x00FF");
    expect(decHex16(4095)).toBe("0x0FFF");
    expect(decHex16(65535)).toBe("0xFFFF");
  });

  test("should wrap values outside 16-bit range", () => {
    expect(decHex16(65536)).toBe("0x0000");
    expect(decHex16(65537)).toBe("0x0001");
    expect(decHex16(-1)).toBe("0xFFFF");
    expect(decHex16(-2)).toBe("0xFFFE");
  });
});

describe("decHex16Val", () => {
  test("should convert decimal to 16-bit hex value without prefix", () => {
    expect(decHex16Val(0)).toBe("0000");
    expect(decHex16Val(1)).toBe("0001");
    expect(decHex16Val(255)).toBe("00FF");
    expect(decHex16Val(4095)).toBe("0FFF");
    expect(decHex16Val(65535)).toBe("FFFF");
  });

  test("should wrap values outside 16-bit range", () => {
    expect(decHex16Val(65536)).toBe("0000");
    expect(decHex16Val(65537)).toBe("0001");
    expect(decHex16Val(-1)).toBe("FFFF");
    expect(decHex16Val(-2)).toBe("FFFE");
  });
});

describe("decHex32Val", () => {
  test("should convert decimal to 32-bit hex value without prefix", () => {
    expect(decHex32Val(0)).toBe("00000000");
    expect(decHex32Val(1)).toBe("00000001");
    expect(decHex32Val(255)).toBe("000000FF");
    expect(decHex32Val(65535)).toBe("0000FFFF");
    expect(decHex32Val(4294967295)).toBe("FFFFFFFF");
  });

  test("should wrap values outside 32-bit range", () => {
    expect(decHex32Val(4294967296)).toBe("00000000");
    expect(decHex32Val(4294967297)).toBe("00000001");
    expect(decHex32Val(-1)).toBe("FFFFFFFF");
    expect(decHex32Val(-2)).toBe("FFFFFFFE");
  });
});

describe("decOct", () => {
  test("should convert decimal to 8-bit octal", () => {
    expect(decOct(0)).toBe("000");
    expect(decOct(1)).toBe("001");
    expect(decOct(8)).toBe("010");
    expect(decOct(64)).toBe("100");
    expect(decOct(255)).toBe("377");
  });

  test("should wrap values outside 8-bit range", () => {
    expect(decOct(256)).toBe("000");
    expect(decOct(257)).toBe("001");
    expect(decOct(-1)).toBe("377");
    expect(decOct(-2)).toBe("376");
  });
});

describe("hexDec", () => {
  test("should convert hex string to decimal", () => {
    expect(hexDec("0")).toBe(0);
    expect(hexDec("1")).toBe(1);
    expect(hexDec("F")).toBe(15);
    expect(hexDec("FF")).toBe(255);
    expect(hexDec("100")).toBe(256);
  });

  test("should handle lowercase hex", () => {
    expect(hexDec("f")).toBe(15);
    expect(hexDec("ff")).toBe(255);
    expect(hexDec("abc")).toBe(2748);
  });

  test("should handle hex with 0x prefix", () => {
    expect(hexDec("0xFF")).toBe(255);
    expect(hexDec("0x100")).toBe(256);
  });
});

describe("fromSigned8Bit", () => {
  test("should convert positive unsigned 8-bit values correctly", () => {
    expect(fromSigned8Bit(0)).toBe(0);
    expect(fromSigned8Bit(1)).toBe(1);
    expect(fromSigned8Bit(127)).toBe(127);
  });

  test("should convert negative unsigned 8-bit values to signed", () => {
    expect(fromSigned8Bit(128)).toBe(-128);
    expect(fromSigned8Bit(255)).toBe(-1);
    expect(fromSigned8Bit(129)).toBe(-127);
    expect(fromSigned8Bit(254)).toBe(-2);
  });

  test("should handle values with upper bits set", () => {
    expect(fromSigned8Bit(0x80)).toBe(-128);
    expect(fromSigned8Bit(0xff)).toBe(-1);
    expect(fromSigned8Bit(0x180)).toBe(-128); // Upper bits masked off
    expect(fromSigned8Bit(0x1ff)).toBe(-1); // Upper bits masked off
  });
});

describe("divisibleBy8", () => {
  test("should return true for values divisible by 8", () => {
    expect(divisibleBy8(0)).toBe(true);
    expect(divisibleBy8(8)).toBe(true);
    expect(divisibleBy8(16)).toBe(true);
    expect(divisibleBy8(24)).toBe(true);
    expect(divisibleBy8(64)).toBe(true);
    expect(divisibleBy8(128)).toBe(true);
  });

  test("should return false for values not divisible by 8", () => {
    expect(divisibleBy8(1)).toBe(false);
    expect(divisibleBy8(7)).toBe(false);
    expect(divisibleBy8(9)).toBe(false);
    expect(divisibleBy8(15)).toBe(false);
    expect(divisibleBy8(23)).toBe(false);
    expect(divisibleBy8(65)).toBe(false);
  });

  test("should handle negative values", () => {
    expect(divisibleBy8(-8)).toBe(true);
    expect(divisibleBy8(-16)).toBe(true);
    expect(divisibleBy8(-1)).toBe(false);
    expect(divisibleBy8(-7)).toBe(false);
  });
});

describe("convertHexTo15BitDec", () => {
  test("should convert black color correctly", () => {
    expect(convertHexTo15BitDec("000000")).toBe(0x400);
  });

  test("should convert white color correctly", () => {
    expect(convertHexTo15BitDec("FFFFFF")).toBe(0x7fff); // 0x7FFF
  });

  test("should convert red color correctly", () => {
    expect(convertHexTo15BitDec("FF0000")).toBe(1055); // Blue=1, Green=0, Red=31
  });

  test("should convert green color correctly", () => {
    expect(convertHexTo15BitDec("00FF00")).toBe(0x7e0); // Blue=1, Green=31, Red=0
  });

  test("should convert blue color correctly", () => {
    expect(convertHexTo15BitDec("0000FF")).toBe(0x7c00); // Blue=32, Green=0, Red=0 but actually blue=31+1=32 so it's 32<<10=32768 but max is 31 so it should be 31<<10+1=31745
  });

  test("should handle mixed colors", () => {
    expect(convertHexTo15BitDec("808080")).toBe(16912); // Gray color
  });

  test("should ensure minimum blue value of 1", () => {
    expect(convertHexTo15BitDec("FF0000")).toBe(1055); // Red with blue=1
    expect(convertHexTo15BitDec("00FF00")).toBe(2016); // Green with blue=1
  });
});

describe("roundDown8", () => {
  test("should round down to nearest multiple of 8", () => {
    expect(roundDown8(0)).toBe(0);
    expect(roundDown8(7)).toBe(0);
    expect(roundDown8(8)).toBe(8);
    expect(roundDown8(15)).toBe(8);
    expect(roundDown8(16)).toBe(16);
    expect(roundDown8(23)).toBe(16);
    expect(roundDown8(64)).toBe(64);
    expect(roundDown8(65)).toBe(64);
  });

  test("should handle negative values", () => {
    expect(roundDown8(-1)).toBe(-8);
    expect(roundDown8(-7)).toBe(-8);
    expect(roundDown8(-8)).toBe(-8);
    expect(roundDown8(-9)).toBe(-16);
  });
});

describe("roundDown16", () => {
  test("should round down to nearest multiple of 16", () => {
    expect(roundDown16(0)).toBe(0);
    expect(roundDown16(15)).toBe(0);
    expect(roundDown16(16)).toBe(16);
    expect(roundDown16(31)).toBe(16);
    expect(roundDown16(32)).toBe(32);
    expect(roundDown16(47)).toBe(32);
    expect(roundDown16(64)).toBe(64);
    expect(roundDown16(65)).toBe(64);
  });

  test("should handle negative values", () => {
    expect(roundDown16(-1)).toBe(-16);
    expect(roundDown16(-15)).toBe(-16);
    expect(roundDown16(-16)).toBe(-16);
    expect(roundDown16(-17)).toBe(-32);
  });
});

describe("roundUp8", () => {
  test("should round up to nearest multiple of 8", () => {
    expect(roundUp8(0)).toBe(0);
    expect(roundUp8(1)).toBe(8);
    expect(roundUp8(7)).toBe(8);
    expect(roundUp8(8)).toBe(8);
    expect(roundUp8(9)).toBe(16);
    expect(roundUp8(15)).toBe(16);
    expect(roundUp8(16)).toBe(16);
    expect(roundUp8(17)).toBe(24);
  });

  test("should handle negative values", () => {
    expect(roundUp8(-1)).toBe(-0);
    expect(roundUp8(-7)).toBe(-0);
    expect(roundUp8(-8)).toBe(-8);
    expect(roundUp8(-9)).toBe(-8);
  });
});

describe("roundUp16", () => {
  test("should round up to nearest multiple of 16", () => {
    expect(roundUp16(0)).toBe(0);
    expect(roundUp16(1)).toBe(16);
    expect(roundUp16(15)).toBe(16);
    expect(roundUp16(16)).toBe(16);
    expect(roundUp16(17)).toBe(32);
    expect(roundUp16(31)).toBe(32);
    expect(roundUp16(32)).toBe(32);
    expect(roundUp16(33)).toBe(48);
  });

  test("should handle negative values", () => {
    expect(roundUp16(-1)).toBe(-0);
    expect(roundUp16(-15)).toBe(-0);
    expect(roundUp16(-16)).toBe(-16);
    expect(roundUp16(-17)).toBe(-16);
  });
});
