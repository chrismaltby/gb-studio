import {
  replaceParams,
  makeTranslator,
  debugTranslationFn,
  showMissingKeysTranslationFn,
  makeTranslationFn,
  languageOverrides
} from "../../src/lib/helpers/l10n";

test("should replace params in l10n string", () => {
  expect(replaceParams("Hello {place}!", { place: "World" })).toBe(
    "Hello World!"
  );
});

test("should replace multiple repeating params in l10n string", () => {
  expect(
    replaceParams("Hello {place}! Around the {place}.", { place: "World" })
  ).toBe("Hello World! Around the World.");
});

test("should not allow spaces around param definition in l10n string", () => {
  expect(replaceParams("Hello { place } again!", { place: "World" })).toBe(
    "Hello { place } again!"
  );
});

test("Should be able to make a translator function from an l10n data hash", () => {
  const translator = makeTranslator({});
  expect(typeof translator).toBe("function");
});

test("Should be able to make a translator function from an l10n data hash", () => {
  const frenchTranslator = makeTranslator({
    HELLO: "Bonjour",
    WORLD: "Monde"
  });
  expect(frenchTranslator("HELLO")).toBe("Bonjour");
  expect(frenchTranslator("WORLD")).toBe("Monde");
});

test("Should be able to replace params in translator function", () => {
  const translator = makeTranslator({
    TEST_STRING: "Version {version} is available"
  });
  expect(translator("TEST_STRING", { version: "2.0.0" })).toBe(
    "Version 2.0.0 is available"
  );
});

test("Should be able to build debug translation lookup", () => {
  expect(debugTranslationFn({ TEST: "TEST" }, "ANOTHER")).toEqual({
    TEST: "TEST",
    ANOTHER: "ANOTHER"
  });
});

test("Should be able to build missing translation lookup", () => {
  expect(showMissingKeysTranslationFn({ FOUND: "Found" })({}, "FOUND")).toEqual(
    {
      FOUND: "Found"
    }
  );
  expect(
    showMissingKeysTranslationFn({ FOUND: "Found" })({}, "ANOTHER")
  ).toEqual({
    ANOTHER: "ANOTHER"
  });
});

test("Should be able to make debug translation function", () => {
  expect(makeTranslationFn({}, {}, "true")).toEqual(debugTranslationFn);
});

test("Should be able to make debug translation function", () => {
  expect(makeTranslationFn({}, {}, "missing").toString()).toEqual(
    showMissingKeysTranslationFn({}).toString()
  );
});

test("should be able to read language overrides", () => {
  expect(languageOverrides("pt-BR")).toMatchObject({
    PROJECT: "Projeto"
  });
});

test("should warn if locale has no translation", () => {
  // eslint-disable-next-line no-console
  console.warn = jest.fn();
  languageOverrides("NEW-LANG");
  // eslint-disable-next-line no-console
  expect(console.warn).toHaveBeenCalled();
});

test("should trace to console if locale is empty", () => {
  // eslint-disable-next-line no-console
  console.warn = jest.fn();
  // eslint-disable-next-line no-console
  console.trace = jest.fn();
  languageOverrides("");
  // eslint-disable-next-line no-console
  expect(console.warn).toHaveBeenCalled();
  // eslint-disable-next-line no-console
  expect(console.trace).toHaveBeenCalled();
});
