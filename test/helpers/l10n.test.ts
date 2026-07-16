import l10n, { L10NKey, replaceParams } from "../../src/shared/lib/lang/l10n";
import { loadLanguage } from "../../src/lib/lang/initElectronL10N";

import { globSync } from "lib/helpers/glob";
import { readFile } from "fs-extra";

jest.mock("../../src/consts");

test("should replace params in l10n string", () => {
  expect(replaceParams("Hello {place}!", { place: "World" })).toBe(
    "Hello World!",
  );
});

test("should replace params in l10n string when param value is falsy", () => {
  expect(replaceParams("Hello {place}!", { place: 0 })).toBe("Hello 0!");
});

test("should replace multiple repeating params in l10n string", () => {
  expect(
    replaceParams("Hello {place}! Around the {place}.", { place: "World" }),
  ).toBe("Hello World! Around the World.");
});

test("should not allow spaces around param definition in l10n string", () => {
  expect(replaceParams("Hello { place } again!", { place: "World" })).toBe(
    "Hello { place } again!",
  );
});

test("Should be able to build debug translation lookup", () => {
  process.env.DEBUG_L10N = "true";
  expect(l10n("HELLO_WORLD" as L10NKey)).toEqual("HELLO_WORLD");
  process.env.DEBUG_L10N = undefined;
});

test("should be able to read language overrides", () => {
  expect(loadLanguage("pt-BR")).toMatchObject({
    PROJECT: "Projeto",
  });
});

test("should warn if locale has no translation", () => {
  console.warn = jest.fn();
  loadLanguage("NEW-LANG");
  expect(console.warn).toHaveBeenCalled();
});

test("should trace to console if locale is empty", () => {
  console.warn = jest.fn();
  console.trace = jest.fn();
  loadLanguage("");
  expect(console.warn).toHaveBeenCalled();
  expect(console.trace).toHaveBeenCalled();
});

test("should be able to parse all language files", async () => {
  const languagePackPaths = globSync("*.json", {
    cwd: `${__dirname}/../../src/lang`,
    absolute: true,
  });
  for (const languagePackPath of languagePackPaths) {
    const rawFile = await readFile(languagePackPath, "utf8");
    try {
      JSON.parse(rawFile);
    } catch (e) {
      throw new Error(`Error parsing language file ${languagePackPath}`);
    }
  }
});
