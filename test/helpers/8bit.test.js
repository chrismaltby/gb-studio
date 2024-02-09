import { decBin, decHex, hi, lo } from "shared/lib/helpers/8bit";

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
