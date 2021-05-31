import l10n, { replaceParams, loadLanguage } from "../../src/lib/helpers/l10n";
import glob from "glob";
import { readFile } from "fs-extra";

jest.mock("../../src/consts");

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

test("Should be able to build debug translation lookup", () => {
  process.env.DEBUG_L10N = "true";
  expect(l10n("HELLO_WORLD")).toEqual("HELLO_WORLD");
  process.env.DEBUG_L10N = undefined;
});

test("should be able to read language overrides", () => {
  expect(loadLanguage("pt-BR")).toMatchObject({
    PROJECT: "Projeto",
  });
});

test("should warn if locale has no translation", () => {
  // eslint-disable-next-line no-console
  console.warn = jest.fn();
  loadLanguage("NEW-LANG");
  // eslint-disable-next-line no-console
  expect(console.warn).toHaveBeenCalled();
});

test("should trace to console if locale is empty", () => {
  // eslint-disable-next-line no-console
  console.warn = jest.fn();
  // eslint-disable-next-line no-console
  console.trace = jest.fn();
  loadLanguage("");
  // eslint-disable-next-line no-console
  expect(console.warn).toHaveBeenCalled();
  // eslint-disable-next-line no-console
  expect(console.trace).toHaveBeenCalled();
});

test("should be able to parse all language files", async () => {
  const languagePackPaths = glob.sync(`${__dirname}/../../src/lang/*.json`);
  for (const languagePackPath of languagePackPaths) {
    const rawFile = await readFile(languagePackPath, "utf8");
    try {
      JSON.parse(rawFile);
    } catch (e) {
      throw new Error(`Error parsing language file ${languagePackPath}`);
    }
  }
});
