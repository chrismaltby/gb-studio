const { setDefault } = require("../../src/lib/helpers/setDefault");

test("Should able to set a default value when input is undefined", () => {
  expect(setDefault(undefined, "Test")).toEqual("Test");
});

test("Should use falsy input", () => {
  expect(setDefault(0, 5)).toEqual(0);
  expect(setDefault(false, true)).toEqual(false);
  expect(setDefault("", "Test")).toEqual("");
});

test("Should use truthy input", () => {
  expect(setDefault(5, 6)).toEqual(5);
  expect(setDefault(true, false)).toEqual(true);
  expect(setDefault("Value", "Test1")).toEqual("Value");
});
