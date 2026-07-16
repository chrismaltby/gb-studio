/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  auditMusicWebL10NManifest,
  generateMusicWebLocales,
} = require("../../../src/apps/gbs-music-web/lang/musicWebLocales");

const makeTempDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "music-web-locales-"));

describe("music web locale tooling", () => {
  test("generateMusicWebLocales writes filtered locale files", () => {
    const rootDir = makeTempDir();
    const localeDir = path.join(rootDir, "lang");
    const outputDir = path.join(rootDir, "generated");
    const manifestPath = path.join(rootDir, "musicWebL10NManifest.json");

    fs.mkdirSync(localeDir, { recursive: true });
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ keys: ["FIELD_ONE", "FIELD_TWO"] }, null, 2),
    );
    fs.writeFileSync(
      path.join(localeDir, "en.json"),
      JSON.stringify(
        {
          FIELD_ONE: "One",
          FIELD_TWO: "Two",
          FIELD_UNUSED: "Unused",
        },
        null,
        2,
      ),
    );
    fs.writeFileSync(
      path.join(localeDir, "de.json"),
      JSON.stringify(
        {
          FIELD_ONE: "Eins",
        },
        null,
        2,
      ),
    );

    const result = generateMusicWebLocales({
      manifestPath,
      localeDir,
      outputDir,
      logger: { warn: jest.fn() },
    });

    expect(
      JSON.parse(fs.readFileSync(path.join(outputDir, "en.json"), "utf8")),
    ).toEqual({
      FIELD_ONE: "One",
      FIELD_TWO: "Two",
    });
    expect(
      JSON.parse(fs.readFileSync(path.join(outputDir, "de.json"), "utf8")),
    ).toEqual({
      FIELD_ONE: "Eins",
    });
    expect(result.missingByLocale).toEqual({
      "de.json": ["FIELD_TWO"],
    });
  });

  test("auditMusicWebL10NManifest reports missing and unused manifest keys", () => {
    const rootDir = makeTempDir();
    const appDir = path.join(rootDir, "src", "apps", "gbs-music-web");
    const musicDir = path.join(rootDir, "src", "components", "music");
    const manifestPath = path.join(rootDir, "musicWebL10NManifest.json");

    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(musicDir, { recursive: true });
    fs.writeFileSync(
      path.join(appDir, "MusicWebApp.tsx"),
      'const a = l10n("FIELD_ALPHA");\n',
    );
    fs.writeFileSync(
      path.join(musicDir, "SongEditor.tsx"),
      'const b = l10n("FIELD_BETA");\n',
    );
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ keys: ["FIELD_ALPHA", "FIELD_GAMMA"] }, null, 2),
    );

    const result = auditMusicWebL10NManifest({
      rootDir,
      manifestPath,
      scanGlobs: [
        "src/apps/gbs-music-web/**/*.{ts,tsx}",
        "src/components/music/**/*.{ts,tsx}",
      ],
    });

    expect(result.missingKeys).toEqual(["FIELD_BETA"]);
    expect(result.unusedKeys).toEqual(["FIELD_GAMMA"]);
  });
});
