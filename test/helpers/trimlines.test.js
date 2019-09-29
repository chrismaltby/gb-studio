import trimlines from "../../src/lib/helpers/trimlines";

test("shouldn't modify strings under line limit", () => {
  expect(trimlines("012345678901234567")).toBe("012345678901234567", 18);
});

test("should trim strings over line limit", () => {
  expect(trimlines("01234567890123456789")).toBe("012345678901234567", 18);
});

test("should wrap words over limit onto new line", () => {
  expect(trimlines("0123456789012345 6789")).toBe("0123456789012345\n6789", 18);
});

test("should trim full string to 52 characters", () => {
  expect(
    trimlines("012345678901234567\n012345678901234567\n012345678901234567")
  ).toBe("012345678901234567\n012345678901234567\n0123456789012345", 18);
});

test("should allow 52 characters to be distributed any way across the three lines", () => {
  // 18 / 18 / 16
  expect(
    trimlines("012345678901234567\n012345678901234567\n0123456789012345")
  ).toBe("012345678901234567\n012345678901234567\n0123456789012345", 18);

  // 16 / 18 / 18
  expect(
    trimlines("0123456789012345\n012345678901234567\n012345678901234567")
  ).toBe("0123456789012345\n012345678901234567\n012345678901234567", 18);

  // 17/ 17 / 18
  expect(
    trimlines("01234567890123456\n01234567890123456\n012345678901234567")
  ).toBe("01234567890123456\n01234567890123456\n012345678901234567", 18);
});
