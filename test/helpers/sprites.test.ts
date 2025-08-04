import { maxSpriteTilesForBackgroundTilesLength } from "shared/lib/helpers/sprites";

describe("maxSpriteTilesForBackgroundTilesLength", () => {
  test("should return correct tile counts for DMG 8x16 mode", () => {
    const data: {
      tiles: number;
      result: number;
    }[] = [
      {
        tiles: 1,
        result: 96,
      },
      {
        tiles: 128,
        result: 96,
      },
      {
        tiles: 160,
        result: 80,
      },
      {
        tiles: 192,
        result: 64,
      },
    ];

    for (const row of data) {
      expect(
        maxSpriteTilesForBackgroundTilesLength(row.tiles, false, "8x16"),
      ).toBe(row.result);
    }
  });

  test("should return correct tile counts for Color 8x16 mode", () => {
    const data: {
      tiles: number;
      result: number;
    }[] = [
      {
        tiles: 1,
        result: 192,
      },
      {
        tiles: 256,
        result: 192,
      },
      {
        tiles: 320,
        result: 160,
      },
      {
        tiles: 384,
        result: 128,
      },
    ];

    for (const row of data) {
      expect(
        maxSpriteTilesForBackgroundTilesLength(row.tiles, true, "8x16"),
      ).toBe(row.result);
    }
  });

  test("should return correct tile counts for DMG 8x8 mode", () => {
    const data: {
      tiles: number;
      result: number;
    }[] = [
      {
        tiles: 1,
        result: 192,
      },
      {
        tiles: 128,
        result: 192,
      },
      {
        tiles: 160,
        result: 160,
      },
      {
        tiles: 192,
        result: 128,
      },
    ];

    for (const row of data) {
      expect(
        maxSpriteTilesForBackgroundTilesLength(row.tiles, false, "8x8"),
      ).toBe(row.result);
    }
  });

  test("should return correct tile counts for Color 8x8 mode", () => {
    const data: {
      tiles: number;
      result: number;
    }[] = [
      {
        tiles: 1,
        result: 384,
      },
      {
        tiles: 256,
        result: 384,
      },
      {
        tiles: 320,
        result: 320,
      },
      {
        tiles: 384,
        result: 256,
      },
    ];

    for (const row of data) {
      expect(
        maxSpriteTilesForBackgroundTilesLength(row.tiles, true, "8x8"),
      ).toBe(row.result);
    }
  });
});
