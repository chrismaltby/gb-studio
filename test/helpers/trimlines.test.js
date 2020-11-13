import trimlines from "../../src/lib/helpers/trimlines";

test("shouldn't modify strings under line limit", () => {
  expect(trimlines("012345678901234567")).toBe("012345678901234567", 18);
});

test("should trim strings over line limit", () => {
  expect(trimlines("0123456789012345678")).toBe("012345678901234567", 18);
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

test("should keep cropped word on last line", () => {
  expect(
    trimlines("012345678901234567\n012345678901234567\n0123456789\n01 2345678901234567")
  ).toBe("012345678901234567\n012345678901234567\n0123456789\n01 234", 18);
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

test("should allow 52 characters to be distributed any way across the four lines", () => {
  // 18 / 18 / 10 / 6
  expect(
    trimlines("012345678901234567\n012345678901234567\n0123456789\n012345")
  ).toBe("012345678901234567\n012345678901234567\n0123456789\n012345");

  // 2 / 14 / 18 / 18
  expect(
    trimlines("01\n01234567890123\n012345678901234567\n012345678901234567")
  ).toBe("01\n01234567890123\n012345678901234567\n012345678901234567");
});


test("should not include command codes in character limits", () => {
  expect(
    trimlines("Hello\nWorld", 5)
  ).toBe("Hello\nWorld");
  expect(
    trimlines("!S0!Hello\nWorld", 5)
  ).toBe("!S0!Hello\nWorld");
  expect(
    trimlines("!S0!HelloTa\nWorld", 5)
  ).toBe("!S0!Hello\nWorld");  
  expect(
    trimlines("!S0!!S0!!S0!!S0!!S0!!S0!!S0!HelloTa\nWorld", 5)
  ).toBe("!S0!!S0!!S0!!S0!!S0!!S0!!S0!Hello\nWorld"); 
  expect(
    trimlines("Hello!S5!\nWorld", 5)
  ).toBe("Hello!S5!\nWorld"); 
});

test("should treat variables as length=3 in character limits", () => {
  expect(
    trimlines("$L0$Hello\nWorld", 5)
  ).toBe("$L0$He\nWorld");  
  expect(
    trimlines("He$L0$\nWorld", 5)
  ).toBe("He$L0$\nWorld");    
  expect(
    trimlines("Hello$L0$\nWorld", 5)
  ).toBe("Hello\nWorld");   
});

test("should treat variable characters as length=1 in character limits", () => {
  expect(
    trimlines("#L0#Hello\nWorld", 5)
  ).toBe("#L0#Hell\nWorld");  
  expect(
    trimlines("Hello#L0#\nWorld", 5)
  ).toBe("Hello\nWorld");   
  expect(
    trimlines("Hell#L0#\nWorld", 5)
  ).toBe("Hell#L0#\nWorld");   
});

test("should treat variables as length=3 in total limits", () => {
  expect(
    trimlines("$L0$Hello\nWorld", 5, 1)
  ).toBe("$L0$He");  
  expect(
    trimlines("He$L0$\nWorld", 5, 1)
  ).toBe("He$L0$");    
  expect(
    trimlines("Hello$L0$\nWorld", 5, 1)
  ).toBe("Hello");   
});

test("should treat variable characters as length=1 in total limits", () => {
  expect(
    trimlines("HelloWorld", 5, 1)
  ).toBe("Hello");
  expect(
    trimlines("#L0#HelloWorld", 5, 1)
  ).toBe("#L0#Hell"); 
  expect(
    trimlines("01234567890123456#L0#\n01234567890123456#L0#\n012345678901234#L0#67")
  ).toBe("01234567890123456#L0#\n01234567890123456#L0#\n012345678901234#L0#", 18);
});

test("should allow trimming text to a single line using third arg", () => {
  expect(trimlines("Obsid$", 6, 1)).toBe("Obsid$");
  expect(trimlines("Obsid $", 6, 1)).toBe("Obsid ");
  expect(trimlines("Obsidian", 6, 1)).toBe("Obsidi");
  expect(trimlines("Obsi\n$", 6, 1)).toBe("Obsi");
  expect(trimlines("\n\n\n\n\n\n", 6, 1)).toBe("");
});
