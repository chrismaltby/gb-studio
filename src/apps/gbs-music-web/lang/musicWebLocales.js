/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

const repoRoot = path.resolve(__dirname, "../../../..");
const defaultManifestPath = path.join(__dirname, "musicWebL10NManifest.json");
const defaultLocaleDir = path.join(repoRoot, "src", "lang");
const defaultOutputDir = path.join(repoRoot, "out", "music-web-locales");
const defaultScanGlobs = [
  "src/apps/gbs-music-web/**/*.{ts,tsx,js,jsx}",
  "src/components/music/**/*.{ts,tsx,js,jsx}",
  "src/shared/lib/uge/**/*.{ts,tsx,js,jsx}",
  "src/store/features/tracker/**/*.{ts,tsx,js,jsx}",
  "src/store/features/trackerDocument/**/*.{ts,tsx,js,jsx}",
  "src/store/features/clipboard/clipboardState/**/*.{ts,tsx,js,jsx}",
  "src/store/features/editor/editorState/**/*.{ts,tsx,js,jsx}",
  "src/store/features/music/musicState/**/*.{ts,tsx,js,jsx}",
  "src/store/features/navigation/navigationState/**/*.{ts,tsx,js,jsx}",
];
const literalL10NKeyPattern = /l10n\(\s*["']([A-Z0-9_-]+)["']/g;

const readJson = (filename) => JSON.parse(fs.readFileSync(filename, "utf8"));

const removeGeneratedMusicWebLocales = (outputDir = defaultOutputDir) => {
  fs.rmSync(outputDir, { recursive: true, force: true });
};

const listLocaleFiles = (localeDir = defaultLocaleDir) =>
  globSync("*.json", {
    cwd: localeDir,
    absolute: true,
  }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const readManifestKeys = (manifestPath = defaultManifestPath) => {
  const manifest = readJson(manifestPath);
  const keys = Array.isArray(manifest.keys) ? manifest.keys : [];
  return [...new Set(keys)].sort((a, b) => a.localeCompare(b));
};

const filterLocaleData = (localeData, allowedKeys) => {
  const allowedKeySet = new Set(allowedKeys);
  return Object.fromEntries(
    Object.entries(localeData).filter(([key]) => allowedKeySet.has(key)),
  );
};

const extractStaticMusicWebL10NKeys = ({
  rootDir = repoRoot,
  scanGlobs = defaultScanGlobs,
} = {}) => {
  const keys = new Set();

  for (const pattern of scanGlobs) {
    const files = globSync(pattern, {
      cwd: rootDir,
      nodir: true,
    });

    for (const relativeFilename of files) {
      const filename = path.join(rootDir, relativeFilename);
      const source = fs.readFileSync(filename, "utf8");
      for (const match of source.matchAll(literalL10NKeyPattern)) {
        const key = match[1];
        if (key) {
          keys.add(key);
        }
      }
    }
  }

  return [...keys].sort((a, b) => a.localeCompare(b));
};

const auditMusicWebL10NManifest = ({
  rootDir = repoRoot,
  manifestPath = defaultManifestPath,
  scanGlobs = defaultScanGlobs,
} = {}) => {
  const manifestKeys = readManifestKeys(manifestPath);
  const scannedKeys = extractStaticMusicWebL10NKeys({ rootDir, scanGlobs });
  const manifestKeySet = new Set(manifestKeys);
  const scannedKeySet = new Set(scannedKeys);

  const missingKeys = scannedKeys.filter((key) => !manifestKeySet.has(key));
  const unusedKeys = manifestKeys.filter((key) => !scannedKeySet.has(key));

  return {
    manifestKeys,
    scannedKeys,
    missingKeys,
    unusedKeys,
  };
};

const generateMusicWebLocales = ({
  manifestPath = defaultManifestPath,
  localeDir = defaultLocaleDir,
  outputDir = defaultOutputDir,
  logger = console,
} = {}) => {
  const manifestKeys = readManifestKeys(manifestPath);
  const sourceLocaleFiles = listLocaleFiles(localeDir);
  const englishFile = path.join(localeDir, "en.json");
  const englishData = readJson(englishFile);
  const missingEnglishKeys = manifestKeys.filter(
    (key) => !(key in englishData),
  );

  if (missingEnglishKeys.length > 0) {
    throw new Error(
      `music web locale manifest references missing English keys: ${missingEnglishKeys.join(", ")}`,
    );
  }

  removeGeneratedMusicWebLocales(outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const missingByLocale = {};

  for (const localeFile of sourceLocaleFiles) {
    const localeName = path.basename(localeFile);
    const localeData = readJson(localeFile);
    const missingKeys = manifestKeys.filter((key) => !(key in localeData));
    if (missingKeys.length > 0) {
      missingByLocale[localeName] = missingKeys;
    }

    const filteredLocaleData = filterLocaleData(localeData, manifestKeys);
    fs.writeFileSync(
      path.join(outputDir, localeName),
      `${JSON.stringify(filteredLocaleData, null, 2)}\n`,
      "utf8",
    );
  }

  const missingLocales = Object.keys(missingByLocale);
  if (missingLocales.length > 0) {
    logger.warn(
      `music web locale generation: ${missingLocales.length} locale file(s) are missing manifest keys and will rely on English fallback`,
    );
  }

  return {
    manifestKeys,
    sourceLocaleFiles,
    outputDir,
    missingByLocale,
  };
};

module.exports = {
  auditMusicWebL10NManifest,
  defaultManifestPath,
  defaultOutputDir,
  generateMusicWebLocales,
  listLocaleFiles,
  removeGeneratedMusicWebLocales,
};
