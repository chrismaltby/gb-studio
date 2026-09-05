import type { BuildUsageSource } from "lib/compiler/buildUsage";
import {
  buildAssetUsageRows,
  matchBuildAssetSource,
  type KnownAssetSymbols,
} from "shared/lib/compiler/buildAssetUsage";

const knownSymbols: KnownAssetSymbols = {
  scenes: new Set(["scene_0"]),
  sprites: new Set(["sprite_player"]),
  backgrounds: new Set(["background_town"]),
};

const buildSource = (sourceFile: string, rom = 0): BuildUsageSource => ({
  sourceFile,
  usage: { bank0: 0, wram: 0, bankedRom: rom },
});

describe("matchBuildAssetSource", () => {
  test("matches scene data and its generated sub-sources", () => {
    expect(matchBuildAssetSource("src/data/scene_0.c", knownSymbols)).toEqual({
      type: "scene",
      symbol: "scene_0",
      sourceType: "data",
    });
    expect(
      matchBuildAssetSource("src/data/scene_0_actors.c", knownSymbols),
    ).toEqual({
      type: "scene",
      symbol: "scene_0",
      sourceType: "actors",
    });
  });

  test("matches sprite and background generated sources", () => {
    expect(
      matchBuildAssetSource(
        "src/data/sprite_player_bank2_tileset.c",
        knownSymbols,
      ),
    ).toEqual({
      type: "sprite",
      symbol: "sprite_player",
      sourceType: "bank2Tileset",
    });
    expect(
      matchBuildAssetSource(
        "src/data/background_town_tilemap_attr.c",
        knownSymbols,
      ),
    ).toEqual({
      type: "background",
      symbol: "background_town",
      sourceType: "tilemapAttr",
    });
  });

  test("matches music and sound by generated folder", () => {
    expect(
      matchBuildAssetSource("src/data/music/song_1_Data.c", knownSymbols),
    ).toEqual({ type: "music", symbol: "song_1", sourceType: "data" });
    expect(
      matchBuildAssetSource("src/data/sounds/sound_1.c", knownSymbols),
    ).toEqual({ type: "sound", symbol: "sound_1", sourceType: "data" });
  });

  test("does not treat engine or unrelated project data as assets", () => {
    expect(
      matchBuildAssetSource("src/core/gbt_player.c", knownSymbols),
    ).toBeUndefined();
    expect(
      matchBuildAssetSource("src/data/data_bootstrap.c", knownSymbols),
    ).toBeUndefined();
  });
});

test("builds one usage row per matched source file", () => {
  expect(
    buildAssetUsageRows(
      [
        buildSource("src/data/scene_0.c", 10),
        buildSource("src/data/scene_0_actors.c", 5),
        buildSource("src/data/sprite_player.c", 100),
        buildSource("src/core/gbt_player.c", 999),
      ],
      knownSymbols,
    ),
  ).toEqual([
    {
      type: "scene",
      symbol: "scene_0",
      sourceType: "data",
      rom: 10,
      sourceFile: "src/data/scene_0.c",
    },
    {
      type: "scene",
      symbol: "scene_0",
      sourceType: "actors",
      rom: 5,
      sourceFile: "src/data/scene_0_actors.c",
    },
    {
      type: "sprite",
      symbol: "sprite_player",
      sourceType: "data",
      rom: 100,
      sourceFile: "src/data/sprite_player.c",
    },
  ]);
});
