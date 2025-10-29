import { optimiseTiles } from "lib/sprites/readSpriteData";
import { compileSprite } from "lib/compiler/compileSprites";
import { join } from "path";
import { ReferencedSprite } from "lib/compiler/precompile/determineUsedAssets";
import { SpriteModeSetting } from "shared/lib/resources/types";

describe("Compile Sprite", () => {
  describe("VRAM Allocation", () => {
    const createTestSprite = (
      spriteMode: SpriteModeSetting,
      colorMode: "mono" | "color" = "mono",
    ): ReferencedSprite => {
      return {
        id: "test-sprite",
        name: "Test Sprite",
        symbol: "sprite_test_sprite",
        filename: "box_8x16px.png",
        numTiles: 2,
        checksum: "test",
        width: 16,
        height: 16,
        canvasWidth: 16,
        canvasHeight: 16,
        canvasOriginX: 0,
        canvasOriginY: 0,
        boundsX: 0,
        boundsY: 0,
        boundsWidth: 16,
        boundsHeight: 16,
        animSpeed: null,
        colorMode,
        spriteMode,
        states: [
          {
            id: "state1",
            name: "",
            animationType: "fixed",
            flipLeft: true,
            animations: [
              {
                id: "anim1",
                frames: [
                  {
                    id: "frame1",
                    tiles: [
                      {
                        id: "tile1",
                        x: 0,
                        y: 0,
                        sliceX: 0,
                        sliceY: 0,
                        palette: 0,
                        flipX: false,
                        flipY: false,
                        objPalette: "OBP0",
                        paletteIndex: 0,
                        priority: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
    };

    test("Should allocate all tiles to VRAM bank 1 for mono mode sprites (8x16)", async () => {
      const sprite = createTestSprite("8x16", "mono");
      const result = await compileSprite(
        sprite,
        false,
        join(__dirname, "../_files"),
        "8x16",
      );

      // All tiles should be in VRAM bank 1 for mono mode
      expect(result.vramData[0].length).toBeGreaterThan(0);
      expect(result.vramData[1].length).toBe(0);
    });

    test("Should allocate all tiles to VRAM bank 1 for mono mode sprites (8x8)", async () => {
      const sprite = createTestSprite("8x8", "mono");
      const result = await compileSprite(
        sprite,
        false,
        join(__dirname, "../_files"),
        "8x8",
      );

      // All tiles should be in VRAM bank 1 for mono mode
      expect(result.vramData[0].length).toBeGreaterThan(0);
      expect(result.vramData[1].length).toBe(0);
    });

    test("Should split 2 tiles correctly in color-only 8x16 mode", async () => {
      const sprite = createTestSprite("8x16", "color");
      const result = await compileSprite(
        sprite,
        true,
        join(__dirname, "../_files"),
        "8x16",
      );

      const numTiles = result.tiles.length;
      expect(numTiles).toBe(2);

      // Both tiles fit in bank 1 for 8x16 mode
      expect(result.vramData[0].length).toBe(2 * 16);
      expect(result.vramData[1].length).toBe(0);
    });

    test("Should split 2 tiles evenly in color-only 8x8 mode", async () => {
      const sprite = createTestSprite("8x8", "color");
      sprite.filename = "box_16px.png";
      sprite.canvasWidth = 16;
      sprite.canvasHeight = 16;

      sprite.states[0].animations[0].frames[0].tiles = [
        {
          id: "tile1",
          x: 0,
          y: 0,
          sliceX: 0,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
        {
          id: "tile2",
          x: 8,
          y: 0,
          sliceX: 8,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
      ];

      const result = await compileSprite(
        sprite,
        true,
        join(__dirname, "../_files"),
        "8x8",
      );

      const numTiles = result.tiles.length;
      const expectedBank1Tiles = Math.ceil(numTiles / 2);

      expect(result.vramData[0].length).toBe(expectedBank1Tiles * 16);
      expect(result.vramData[1].length).toBe(
        (numTiles - expectedBank1Tiles) * 16,
      );

      // Verify no gaps in allocation
      const totalVramTiles =
        (result.vramData[0].length + result.vramData[1].length) / 16;
      expect(totalVramTiles).toBe(numTiles);
    });

    test("Should split 3 tiles correctly in color-only 8x8 mode", async () => {
      const sprite = createTestSprite("8x8", "color");
      sprite.filename = "box_16px.png";
      sprite.canvasWidth = 24;
      sprite.canvasHeight = 8;

      sprite.states[0].animations[0].frames[0].tiles = [
        {
          id: "tile1",
          x: 0,
          y: 0,
          sliceX: 0,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
        {
          id: "tile2",
          x: 8,
          y: 0,
          sliceX: 8,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
        {
          id: "tile3",
          x: 16,
          y: 0,
          sliceX: 0,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
      ];

      const result = await compileSprite(
        sprite,
        true,
        join(__dirname, "../_files"),
        "8x8",
      );

      const numTiles = result.tiles.length;
      const expectedBank1Tiles = Math.ceil(numTiles / 2);

      expect(result.vramData[0].length).toBe(expectedBank1Tiles * 16);
      expect(result.vramData[1].length).toBe(
        (numTiles - expectedBank1Tiles) * 16,
      );

      // Verify no gaps in allocation
      const totalVramTiles =
        (result.vramData[0].length + result.vramData[1].length) / 16;
      expect(totalVramTiles).toBe(numTiles);
    });

    test("Should split 2 tiles with no gaps in color-only 8x8 mode", async () => {
      const sprite = createTestSprite("8x8", "color");
      sprite.filename = "box_16px.png";
      sprite.canvasWidth = 24;
      sprite.canvasHeight = 8;

      sprite.states[0].animations[0].frames[0].tiles = [
        {
          id: "tile1",
          x: 0,
          y: 0,
          sliceX: 0,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
        {
          id: "tile2",
          x: 8,
          y: 0,
          sliceX: 8,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
      ];

      const result = await compileSprite(
        sprite,
        true,
        join(__dirname, "../_files"),
        "8x8",
      );

      const numTiles = result.tiles.length;
      const expectedBank1Tiles = Math.ceil(numTiles / 2);

      expect(result.vramData[0].length).toBe(expectedBank1Tiles * 16);
      expect(result.vramData[1].length).toBe(
        (numTiles - expectedBank1Tiles) * 16,
      );

      // Verify no gaps in allocation
      const totalVramTiles =
        (result.vramData[0].length + result.vramData[1].length) / 16;
      expect(totalVramTiles).toBe(numTiles);
    });

    test("Should allocate tiles evenly without gaps in 8x8 color-only mode", async () => {
      const sprite = createTestSprite("8x8", "color");
      sprite.filename = "box_16px.png";

      sprite.states[0].animations[0].frames[0].tiles = [
        {
          id: "tile1",
          x: 0,
          y: 0,
          sliceX: 0,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
        {
          id: "tile2",
          x: 8,
          y: 0,
          sliceX: 8,
          sliceY: 0,
          palette: 0,
          flipX: false,
          flipY: false,
          objPalette: "OBP0",
          paletteIndex: 0,
          priority: false,
        },
      ];

      const result = await compileSprite(
        sprite,
        true,
        join(__dirname, "../_files"),
        "8x8",
      );

      const numTiles = result.tiles.length;
      const totalVramTiles =
        (result.vramData[0].length + result.vramData[1].length) / 16;

      // Verify no gaps exist in tile allocation
      expect(totalVramTiles).toBe(numTiles);

      // Verify correct split formula is used for 8x8 mode
      const expectedBank1Tiles = Math.ceil(numTiles / 2);
      const actualBank1Tiles = result.vramData[0].length / 16;

      expect(actualBank1Tiles).toBe(expectedBank1Tiles);
    });
  });
});

describe("Optimise Tiles", () => {
  const expectValidTilesOfLength = (
    tiles: { width: number; height: number; data: ArrayLike<number> }[],
    expectedLength: number,
  ) => {
    expect(tiles).toHaveLength(expectedLength);
    for (const tile of tiles) {
      expect(tile.width).toBe(8);
      expect(tile.height).toBe(8);
      expect(tile.data.length).toBe(64);
    }
  };

  const asciiToData = (ascii: string) => {
    return ascii
      .trim()
      .split("\n")
      .map((line) =>
        line
          .trim()
          .split("")
          .map((c) => {
            if (c === ".") return 1;
            if (c === "x") return 2;
            if (c === "X") return 3;
            return 0;
          }),
      )
      .flat();
  };

  const dataToAscii = (data: ArrayLike<number>) => {
    let output = "";
    for (let i = 0; i < data.length; i++) {
      if (i > 0 && i % 8 === 0) {
        output += "\n";
      }
      if (data[i] === 1) output += ".";
      else if (data[i] === 2) output += "x";
      else if (data[i] === 3) output += "X";
      else output += "?";
    }
    return output;
  };

  const expectTileMatchAscii = (data: ArrayLike<number>, ascii: string) => {
    expect(dataToAscii(data)).toBe(ascii.trim().replace(/ /g, ""));
    expect(Array.from(data)).toEqual(asciiToData(ascii));
  };

  describe("Mode: 8x16", () => {
    test("Should generate sprite data correctly on 16x16 px canvas", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "box_8x16px.png",
      );

      const result = await optimiseTiles(
        filename,
        16,
        16,
        [
          [
            {
              id: "tile1",
              x: 0,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
          ],
        ],
        "8x16",
      );

      expectValidTilesOfLength(result.tiles, 2);

      expectTileMatchAscii(
        result.tiles[0].data,
        `
        .XXXXXX.
        XxxxxxxX
        XX....xX
        XX....xX
        XX....xX
        XX....xX
        XX....xX
        XX.X..xX`,
      );
      expectTileMatchAscii(
        result.tiles[1].data,
        `
        XX.XX.xX
        XX....xX
        XX....xX
        XX....xX
        XX....xX
        XXx...xX
        XXXXXXxX 
        .XXXXXX.`,
      );
    });

    test("Should generate multi tile sprite data correctly on 16x16 px canvas", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "box_16px.png",
      );

      const result = await optimiseTiles(
        filename,
        16,
        16,
        [
          [
            {
              id: "tile1",
              x: 0,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              flipX: false,
              flipY: false,
              palette: 0,
              paletteIndex: 0,
              objPalette: "OBP0",
              priority: false,
            },
            {
              id: "tile2",
              x: 8,
              y: 0,
              sliceX: 8,
              sliceY: 0,
              flipX: false,
              flipY: false,
              palette: 0,
              paletteIndex: 0,
              objPalette: "OBP0",
              priority: false,
            },
          ],
        ],
        "8x16",
      );

      expectValidTilesOfLength(result.tiles, 4);

      expect(result.lookup.tile1?.tile).toBeDefined();
      expect(result.lookup.tile2?.tile).toBeDefined();

      const tile1Index = result.lookup.tile1?.tile ?? 0;
      const tile2Index = result.lookup.tile2?.tile ?? 0;

      expectTileMatchAscii(
        result.tiles[tile1Index].data,
        `
        .XXXXXXX
        Xxxxxxxx
        XX......
        XX......
        XX......
        XX......
        XX......
        XX.....X`,
      );

      expectTileMatchAscii(
        result.tiles[tile1Index + 1].data,
        `
        XX.....X
        XX......
        XX......
        XX......
        XX......
        XXx.....
        XXXXXXXX
        .XXXXXXX`,
      );

      expectTileMatchAscii(
        result.tiles[tile2Index].data,
        `
        XXXXXXX.
        xxxxxxxX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX`,
      );

      expectTileMatchAscii(
        result.tiles[tile2Index + 1].data,
        `
        X.....xX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX
        XXXXXXxX
        XXXXXXXX`,
      );
    });

    test("Should make occuluded tile data transparent", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "box_16px.png",
      );

      const result = await optimiseTiles(
        filename,
        16,
        16,
        [
          [
            {
              id: "tile1",
              x: 0,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              flipX: false,
              flipY: false,
              palette: 0,
              paletteIndex: 0,
              objPalette: "OBP0",
              priority: false,
            },
            {
              id: "tile2",
              x: 1,
              y: 0,
              sliceX: 8,
              sliceY: 0,
              flipX: false,
              flipY: false,
              palette: 0,
              paletteIndex: 0,
              objPalette: "OBP0",
              priority: false,
            },
          ],
        ],
        "8x16",
      );

      expectValidTilesOfLength(result.tiles, 4);

      expect(result.lookup.tile1?.tile).toBeDefined();
      expect(result.lookup.tile2?.tile).toBeDefined();

      const tile1Index = result.lookup.tile1?.tile ?? 0;
      const tile2Index = result.lookup.tile2?.tile ?? 0;

      expectTileMatchAscii(
        result.tiles[tile1Index].data,
        `
        .???????
        X???????
        X???????
        X???????
        X???????
        X???????
        X???????
        X???????`,
      );

      expectTileMatchAscii(
        result.tiles[tile1Index + 1].data,
        `
        X???????
        X???????
        X???????
        X???????
        X???????
        X???????
        X???????
        .???????`,
      );

      expectTileMatchAscii(
        result.tiles[tile2Index].data,
        `
        XXXXXXX.
        xxxxxxxX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX`,
      );

      expectTileMatchAscii(
        result.tiles[tile2Index + 1].data,
        `
        X.....xX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX
        XXXXXXxX
        XXXXXXXX`,
      );
    });

    test("Should reuse tiles where occulusion causes visible tiles to be equivalent", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "sprite_occlude.png",
      );

      const result = await optimiseTiles(
        filename,
        32,
        32,
        [
          [
            {
              id: "tile1",
              x: 0,
              y: 8,
              sliceX: 0,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
            {
              id: "tile2",
              x: 8,
              y: 8,
              sliceX: 8,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
            {
              id: "tile3",
              x: 8,
              y: 0,
              sliceX: 16,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
            {
              id: "tile4",
              x: 0,
              y: 0,
              sliceX: 16,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
          ],
        ],
        "8x16",
      );

      expectValidTilesOfLength(result.tiles, 4);

      expect(result.lookup.tile1?.tile).toBeDefined();
      expect(result.lookup.tile2?.tile).toBeDefined();

      const tile1Index = result.lookup.tile1?.tile ?? 0;
      const tile2Index = result.lookup.tile2?.tile ?? 0;
      const tile3Index = result.lookup.tile3?.tile ?? 0;
      const tile4Index = result.lookup.tile4?.tile ?? 0;

      // Tile 1 and 2 are the same in top half and the bottom half is occluded
      // so they should be reused
      expect(tile1Index).toBe(tile2Index);
      // Tile 3 and 4 contain identical tile data
      expect(tile3Index).toBe(tile4Index);

      expect(Array.from(result.tiles[tile1Index].data)).toEqual(
        asciiToData(`
        ........
        ..XXXX..
        .X....X.
        .X....X.
        .XXXXXX.
        .X....X.
        .X....X.
        ........`),
      );

      expect(Array.from(result.tiles[tile1Index + 1].data)).toEqual(
        asciiToData(`
        ????????
        ????????
        ????????
        ????????
        ????????
        ????????
        ????????
        ????????`),
      );

      expect(Array.from(result.tiles[tile3Index].data)).toEqual(
        asciiToData(`
        ........
        .XXXXX..
        .X....X.
        .X....X.
        .X....X.
        .X....X.
        .XXXXX..
        ........`),
      );

      expect(Array.from(result.tiles[tile3Index + 1].data)).toEqual(
        asciiToData(`
        ........
        .XXXXXX.
        .X......
        .XXX....
        .X......
        .X......
        .XXXXXX.
        ........`),
      );
    });

    test("Should not include tiles that were completely outside of canvas", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "box_16px.png",
      );

      const result = await optimiseTiles(
        filename,
        16,
        16,
        [
          [
            {
              id: "tile1",
              x: -8,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              flipX: false,
              flipY: false,
              palette: 0,
              paletteIndex: 0,
              objPalette: "OBP0",
              priority: false,
            },
            {
              id: "tile2",
              x: 0,
              y: 0,
              sliceX: 8,
              sliceY: 0,
              flipX: false,
              flipY: false,
              palette: 0,
              paletteIndex: 0,
              objPalette: "OBP0",
              priority: false,
            },
          ],
        ],
        "8x16",
      );

      expectValidTilesOfLength(result.tiles, 2);

      expect(result.lookup.tile1?.tile).toBeUndefined();
      expect(result.lookup.tile2?.tile).toBeDefined();

      const tile2Index = result.lookup.tile2?.tile ?? 0;

      expectTileMatchAscii(
        result.tiles[tile2Index].data,
        `
        XXXXXXX.
        xxxxxxxX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX`,
      );

      expectTileMatchAscii(
        result.tiles[tile2Index + 1].data,
        `
        X.....xX
        ......xX
        ......xX
        ......xX
        ......xX
        ......xX
        XXXXXXxX
        XXXXXXXX`,
      );
    });

    test("Should not include tiles that are completely occuluded", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "sprite_occlude.png",
      );

      const result = await optimiseTiles(
        filename,
        32,
        32,
        [
          [
            {
              id: "tile1",
              x: 0,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
            {
              id: "tile2",
              x: 0,
              y: 0,
              sliceX: 16,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
          ],
        ],
        "8x16",
      );

      expectValidTilesOfLength(result.tiles, 2);

      expect(result.lookup.tile1?.tile).toBeUndefined();
      expect(result.lookup.tile2?.tile).toBeDefined();

      const tile2Index = result.lookup.tile2?.tile ?? 0;

      expect(Array.from(result.tiles[tile2Index].data)).toEqual(
        asciiToData(`
        ........
        .XXXXX..
        .X....X.
        .X....X.
        .X....X.
        .X....X.
        .XXXXX..
        ........`),
      );

      expect(Array.from(result.tiles[tile2Index + 1].data)).toEqual(
        asciiToData(`
        ........
        .XXXXXX.
        .X......
        .XXX....
        .X......
        .X......
        .XXXXXX.
        ........`),
      );
    });

    test("Should generate sprite data correctly on 8x16 px canvas", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "box_8x16px.png",
      );

      const result = await optimiseTiles(
        filename,
        8,
        16,
        [
          [
            {
              id: "tile1",
              x: 0,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
          ],
        ],
        "8x16",
      );

      expectValidTilesOfLength(result.tiles, 2);

      expectTileMatchAscii(
        result.tiles[0].data,
        `
        .XXXXXX.
        XxxxxxxX
        XX....xX
        XX....xX
        XX....xX
        XX....xX
        XX....xX
        XX.X..xX`,
      );

      expectTileMatchAscii(
        result.tiles[1].data,
        `
        XX.XX.xX
        XX....xX
        XX....xX
        XX....xX
        XX....xX
        XXx...xX
        XXXXXXxX
        .XXXXXX.`,
      );
    });

    test("Should flip and reuse tiles where possible", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "box_16px_mirror.png",
      );

      const result = await optimiseTiles(
        filename,
        32,
        32,
        [
          [
            {
              id: "tile1",
              x: 0,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              flipX: false,
              flipY: false,
              palette: 0,
              paletteIndex: 0,
              objPalette: "OBP0",
              priority: false,
            },
            {
              id: "tile2",
              x: 8,
              y: 0,
              sliceX: 8,
              sliceY: 0,
              flipX: false,
              flipY: false,
              palette: 0,
              paletteIndex: 0,
              objPalette: "OBP0",
              priority: false,
            },
          ],
        ],
        "8x16",
      );

      expect(result.lookup.tile1?.tile).toBeDefined();
      expect(result.lookup.tile2?.tile).toBeDefined();

      expect(result.lookup.tile1?.tile).toBeDefined();
      expect(result.lookup.tile2?.tile).toBeDefined();

      const tile1Index = result.lookup.tile1?.tile ?? 0;
      const tile2Index = result.lookup.tile2?.tile ?? 0;

      expect(tile1Index).toEqual(tile2Index);

      expect(result.lookup.tile1?.flipX).toBe(true);
      expect(result.lookup.tile2?.flipX).toBe(false);

      expectTileMatchAscii(
        result.tiles[tile1Index].data,
        `
        XXXXXXX.
        xxxxxxxX
        ......XX
        ......XX
        ......XX
        ......XX
        ......XX
        X.....XX`,
      );

      expectTileMatchAscii(
        result.tiles[tile1Index + 1].data,
        `
        X.....XX
        ......XX
        ......XX
        ......XX
        ......XX
        .....xXX
        XXXXXXXX
        XXXXXXX.`,
      );
    });
  });

  describe("Mode: 8x8", () => {
    test("Should generate sprite data correctly on 8x8 px canvas", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "box_8px.png",
      );

      const result = await optimiseTiles(
        filename,
        8,
        8,
        [
          [
            {
              id: "tile1",
              x: 0,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
          ],
        ],
        "8x8",
      );

      expectValidTilesOfLength(result.tiles, 1);
      expectTileMatchAscii(
        result.tiles[0].data,
        `
        .XXXXXX.
        XxxxxxxX
        XX....xX
        XX.X..xX
        XX.XX.xX
        XXx...xX
        XXXXXXxX
        .XXXXXX.`,
      );
    });

    test("Should make sprite data outside of canvas transparent", async () => {
      const filename = join(
        __dirname,
        "../_files/assets/sprites",
        "box_8px.png",
      );

      const result = await optimiseTiles(
        filename,
        8,
        8,
        [
          [
            {
              id: "tile1",
              x: -4,
              y: 0,
              sliceX: 0,
              sliceY: 0,
              palette: 0,
              flipX: false,
              flipY: false,
              objPalette: "OBP0",
              paletteIndex: 0,
              priority: false,
            },
          ],
        ],
        "8x8",
      );

      expectValidTilesOfLength(result.tiles, 1);
      expectTileMatchAscii(
        result.tiles[0].data,
        `
        ????XXX.
        ????xxxX
        ????..xX
        ????..xX
        ????X.xX
        ????..xX
        ????XXxX
        ????XXX.`,
      );
    });
  });
});
