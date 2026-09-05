import type { BuildUsageSource } from "lib/compiler/buildUsage";

export type BuildAssetType =
  "scene" | "sprite" | "background" | "music" | "sound";

export type BuildAssetSourceType =
  | "data"
  | "actors"
  | "collisions"
  | "triggers"
  | "sprites"
  | "projectiles"
  | "tileset"
  | "cgbTileset"
  | "tilemap"
  | "tilemapAttr";

export type KnownAssetSymbols = {
  scenes: ReadonlySet<string>;
  sprites: ReadonlySet<string>;
  backgrounds: ReadonlySet<string>;
};

export type BuildAssetMatch = {
  type: BuildAssetType;
  symbol: string;
};

export type BuildAssetSourceMatch = BuildAssetMatch & {
  sourceType: BuildAssetSourceType;
};

const DATA_PREFIX = "src/data/";

const SCENE_SUFFIXES: [string, BuildAssetSourceType][] = [
  ["_actors", "actors"],
  ["_collisions", "collisions"],
  ["_triggers", "triggers"],
  ["_sprites", "sprites"],
  ["_projectiles", "projectiles"],
];

const SPRITE_SUFFIXES: [string, BuildAssetSourceType][] = [
  ["_tileset", "tileset"],
  ["_bank2_tileset", "cgbTileset"],
];

const BACKGROUND_SUFFIXES: [string, BuildAssetSourceType][] = [
  ["_tileset", "tileset"],
  ["_cgb_tileset", "cgbTileset"],
  ["_tilemap", "tilemap"],
  ["_tilemap_attr", "tilemapAttr"],
];

const matchSymbol = (
  base: string,
  knownSymbols: ReadonlySet<string>,
  suffixes: [string, BuildAssetSourceType][],
): Pick<BuildAssetSourceMatch, "symbol" | "sourceType"> | undefined => {
  if (knownSymbols.has(base)) {
    return { symbol: base, sourceType: "data" };
  }
  for (const [suffix, sourceType] of suffixes) {
    if (base.endsWith(suffix)) {
      const candidate = base.slice(0, base.length - suffix.length);
      if (knownSymbols.has(candidate)) {
        return { symbol: candidate, sourceType };
      }
    }
  }
  return undefined;
};

export const matchBuildAssetSource = (
  sourceFile: string,
  knownSymbols: KnownAssetSymbols,
): BuildAssetSourceMatch | undefined => {
  if (!sourceFile.startsWith(DATA_PREFIX)) {
    return undefined;
  }
  const rest = sourceFile.slice(DATA_PREFIX.length);

  const musicMatch = /^music\/(.+)_Data\.c$/.exec(rest);
  if (musicMatch) {
    return { type: "music", symbol: musicMatch[1], sourceType: "data" };
  }

  const soundMatch = /^sounds\/(.+)\.c$/.exec(rest);
  if (soundMatch) {
    return { type: "sound", symbol: soundMatch[1], sourceType: "data" };
  }

  const baseMatch = /^([^/]+)\.c$/.exec(rest);
  if (!baseMatch) {
    return undefined;
  }
  const base = baseMatch[1];

  const sceneSymbol = matchSymbol(base, knownSymbols.scenes, SCENE_SUFFIXES);
  if (sceneSymbol) {
    return { type: "scene", ...sceneSymbol };
  }

  const spriteSymbol = matchSymbol(base, knownSymbols.sprites, SPRITE_SUFFIXES);
  if (spriteSymbol) {
    return { type: "sprite", ...spriteSymbol };
  }

  const backgroundSymbol = matchSymbol(
    base,
    knownSymbols.backgrounds,
    BACKGROUND_SUFFIXES,
  );
  if (backgroundSymbol) {
    return { type: "background", ...backgroundSymbol };
  }

  return undefined;
};

export type BuildAssetUsageRow = {
  type: BuildAssetType;
  symbol: string;
  sourceType: BuildAssetSourceType;
  rom: number;
  sourceFile: string;
};

export const buildAssetUsageRows = (
  sources: BuildUsageSource[],
  knownSymbols: KnownAssetSymbols,
): BuildAssetUsageRow[] => {
  const rows: BuildAssetUsageRow[] = [];
  for (const source of sources) {
    const match = matchBuildAssetSource(source.sourceFile, knownSymbols);
    if (!match) {
      continue;
    }
    rows.push({
      type: match.type,
      symbol: match.symbol,
      sourceType: match.sourceType,
      rom: source.usage.bank0 + source.usage.bankedRom,
      sourceFile: source.sourceFile,
    });
  }
  return rows;
};
