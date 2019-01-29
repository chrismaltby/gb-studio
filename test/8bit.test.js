import { decBin, decHex } from "../src/lib/helpers/8bit";

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
