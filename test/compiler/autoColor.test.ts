import { PNG } from "pngjs";
import { writeFile } from "fs-extra";
import { readFileToPalettes } from "lib/tiles/readFileToPalettes";
import {
  IndexedImage,
  pixelDataToIndexedImage,
} from "shared/lib/tiles/indexedImage";
import {
  extractTilePaletteWithHint,
  compressPalettes,
  compressSparsePalettes,
  SparseHexPalette,
  setUIPalette,
  HexPalette,
} from "shared/lib/tiles/autoColor";
import { tileDataIndexFn } from "shared/lib/tiles/tileData";

test("Should reduce the palettes to a maximum of 8", async () => {
  const filename = `${__dirname}/_files/test/color_town.png`;
  const paletteData = await readFileToPalettes(filename, "default", [
    "ffffff",
    "aaaaaa",
    "555555",
    "000000",
  ]);
  writeIndexedImagePNG(
    `${__dirname}/_tmp/color_town_tiles.png`,
    paletteData.indexedImage,
  );
});

test("Should reduce the palettes to a maximum of 8", async () => {
  const filename = `${__dirname}/_files/test/parallax_color.png`;
  const paletteData = await readFileToPalettes(filename, "default", [
    "ffffff",
    "aaaaaa",
    "555555",
    "000000",
  ]);
  writeIndexedImagePNG(
    `${__dirname}/_tmp/parallax_color_tiles.png`,
    paletteData.indexedImage,
  );
});

const writeIndexedImagePNG = async (
  filename: string,
  img: IndexedImage,
): Promise<void> => {
  const png = new PNG({
    width: img.width,
    height: img.height,
  });
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const dataIdx = img.data[idx / 4];

      if (dataIdx === 3) {
        png.data[idx] = 7;
        png.data[idx + 1] = 24;
        png.data[idx + 2] = 33;
      } else if (dataIdx === 2) {
        png.data[idx] = 48;
        png.data[idx + 1] = 104;
        png.data[idx + 2] = 80;
      } else if (dataIdx === 1) {
        png.data[idx] = 134;
        png.data[idx + 1] = 192;
        png.data[idx + 2] = 108;
      } else {
        png.data[idx] = 224;
        png.data[idx + 1] = 248;
        png.data[idx + 2] = 207;
      }

      png.data[idx + 3] = 255; // Alpha
    }
  }
  const options = { colorType: 6 } as const;
  const buffer = PNG.sync.write(png, options);
  await writeFile(filename, buffer);
};

describe("extractTilePaletteWithHint", () => {
  test("should extract palette with hint and color correction off", () => {
    const pixels = new Uint8ClampedArray(8 * 8 * 4);
    const dmgPixels = new Uint8ClampedArray(8 * 8 * 4);

    pixels[0] = 255;
    pixels[1] = 255;
    pixels[2] = 255;
    pixels[3] = 255;

    dmgPixels[0] = 170;
    dmgPixels[1] = 170;
    dmgPixels[2] = 170;
    dmgPixels[3] = 255;

    const width = 8;
    const height = 8;
    const tileX = 0;
    const tileY = 0;

    const setPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
    ) => {
      const index = (y * width + x) * 4;
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = 255;
    };
    const setDmgPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
    ) => {
      const index = (y * width + x) * 4;
      dmgPixels[index] = r;
      dmgPixels[index + 1] = g;
      dmgPixels[index + 2] = b;
      dmgPixels[index + 3] = 255;
    };

    setPixel(0, 0, 255, 0, 0);
    setPixel(1, 0, 0, 255, 0);
    setPixel(2, 0, 147, 148, 254);
    setPixel(3, 0, 255, 0, 255);

    setDmgPixel(0, 0, 0, 0, 0);
    setDmgPixel(1, 0, 66, 66, 66);
    setDmgPixel(2, 0, 131, 131, 131);
    setDmgPixel(3, 0, 206, 206, 206);

    const dmgIndexed = pixelDataToIndexedImage(
      width,
      height,
      dmgPixels,
      tileDataIndexFn,
    );

    const sparsePalette = extractTilePaletteWithHint(
      pixels,
      width,
      tileX,
      tileY,
      dmgIndexed,
      "default",
    );
    expect(sparsePalette).toEqual(["ff00ff", "935fff", "00ff00", "ff1f00"]);
  });

  test("should extract palette with hint", () => {
    const pixels = new Uint8ClampedArray(8 * 8 * 4);
    const dmgPixels = new Uint8ClampedArray(8 * 8 * 4);

    pixels[0] = 255;
    pixels[1] = 255;
    pixels[2] = 255;
    pixels[3] = 255;

    dmgPixels[0] = 170;
    dmgPixels[1] = 170;
    dmgPixels[2] = 170;
    dmgPixels[3] = 255;

    const width = 8;
    const height = 8;
    const tileX = 0;
    const tileY = 0;

    const setPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
    ) => {
      const index = (y * width + x) * 4;
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = 255;
    };
    const setDmgPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
    ) => {
      const index = (y * width + x) * 4;
      dmgPixels[index] = r;
      dmgPixels[index + 1] = g;
      dmgPixels[index + 2] = b;
      dmgPixels[index + 3] = 255;
    };

    setPixel(0, 0, 255, 0, 0);
    setPixel(1, 0, 0, 255, 0);
    setPixel(2, 0, 147, 148, 254);
    setPixel(3, 0, 255, 0, 255);

    setDmgPixel(0, 0, 0, 0, 0);
    setDmgPixel(1, 0, 66, 66, 66);
    setDmgPixel(2, 0, 131, 131, 131);
    setDmgPixel(3, 0, 206, 206, 206);

    const dmgIndexed = pixelDataToIndexedImage(
      width,
      height,
      dmgPixels,
      tileDataIndexFn,
    );

    const sparsePalette = extractTilePaletteWithHint(
      pixels,
      width,
      tileX,
      tileY,
      dmgIndexed,
      "none",
    );
    expect(sparsePalette).toEqual(["ff00ff", "9394fe", "00ff00", "ff0000"]);
  });
});

describe("compressPalettes", () => {
  test("merges overlapping palettes down to 4 colors and maps all to palette 0", () => {
    const palettes = [
      ["111111"],
      ["222222"],
      ["111111", "222222"],
      ["333333"],
      ["333333", "444444"],
      ["444444"],
      ["111111", "333333"],
      ["222222", "444444"],
      ["111111", "222222", "333333", "444444"],
    ];
    const { palettes: out, mappingTable } = compressPalettes(palettes);

    // Should merge to at least one palette containing all four colors
    const mergedContainsAll = out.some((p) =>
      ["111111", "222222", "333333", "444444"].every((c) => p.includes(c)),
    );
    expect(mergedContainsAll).toBe(true);

    // Mapping table should map everything to a single palette index (0..7)
    expect(mappingTable).toHaveLength(palettes.length);
    expect(mappingTable.every((v) => v === 0)).toBe(true);
  });

  test("returns identity mapping and same palettes when <= 8 palettes", () => {
    const palettes = [["111111"], ["222222"], ["333333"]];
    const { palettes: out, mappingTable } = compressPalettes(palettes);
    expect(out).toEqual([
      ["111111", "000000", "000000", "000000"],
      ["222222", "000000", "000000", "000000"],
      ["333333", "000000", "000000", "000000"],
    ]);
    expect(mappingTable).toEqual([0, 1, 2]);
  });

  test("caps mapping table indices to 8 when unmergeable > 8 palettes", () => {
    const makePal = (i: number) => [
      (i * 4 + 1).toString(16).padStart(6, "0"),
      (i * 4 + 2).toString(16).padStart(6, "0"),
      (i * 4 + 3).toString(16).padStart(6, "0"),
      (i * 4 + 4).toString(16).padStart(6, "0"),
    ];
    const palettes = Array.from({ length: 9 }, (_, i) => makePal(i));
    const { mappingTable } = compressPalettes(palettes);
    expect(mappingTable).toHaveLength(9);
    // Index 8 should wrap to 0
    expect(mappingTable[8]).toBe(0);
    expect(mappingTable.every((v) => v >= 0 && v < 8)).toBe(true);
  });
});

describe("compressSparsePalettes", () => {
  test("merges compatible sparse palettes into a single palette", () => {
    const A: SparseHexPalette = ["111111", undefined, undefined, undefined];
    const B: SparseHexPalette = [undefined, "222222", undefined, undefined];
    const C: SparseHexPalette = [undefined, undefined, "333333", undefined];

    const { palettes, mappingTable } = compressSparsePalettes([A, B, C]);

    expect(palettes.length).toBe(1);
    expect(palettes[0]).toEqual(["111111", "222222", "333333", "000000"]);
    expect(mappingTable).toEqual([0, 0, 0]);
  });

  test("does not merge conflicting sparse palettes (different colors in same slot)", () => {
    const A: SparseHexPalette = ["111111", undefined, undefined, undefined];
    const B: SparseHexPalette = ["222222", undefined, undefined, undefined];

    const { palettes, mappingTable } = compressSparsePalettes([A, B]);

    expect(palettes.length).toBe(2);
    // Both resulting palettes must keep their first slot color
    const colorsAt0 = new Set(palettes.map((p) => p[0]));
    expect(colorsAt0.has("111111")).toBe(true);
    expect(colorsAt0.has("222222")).toBe(true);

    // Each original maps to a distinct palette index
    expect(new Set(mappingTable).size).toBe(2);
    expect(mappingTable).toHaveLength(2);
  });
});

describe("setUIPalette", () => {
  test("If UI palette is exactly matched in existing palettes, move the match to position 7", () => {
    const inputPalettes: HexPalette[] = [
      ["64a5ff", "ffad63", "9394fe", "000000"],
      ["833100", "ffad63", "8b8cde", "000000"],
      ["5b315b", "f7c4a5", "9394fe", "000000"],
      ["ffe7c5", "f7c4a5", "525252", "000000"],
      ["7bff30", "f7c4a5", "8b8cde", "000000"],
      ["833100", "5b315b", "9394fe", "000000"],
      ["833100", "ffad63", "000000", "000000"],
      ["833100", "008486", "000000", "000000"],
    ];
    const inputMappingTable = [0, 1, 2, 3, 4, 5, 6, 7];
    const { palettes, mappingTable } = setUIPalette(
      {
        palettes: inputPalettes,
        mappingTable: inputMappingTable,
      },
      ["64a5ff", "ffad63", "9394fe", "000000"],
    );
    expect(palettes).toHaveLength(8);
    expect(palettes[7]).toEqual(["64a5ff", "ffad63", "9394fe", "000000"]);
    expect(mappingTable).toEqual([7, 1, 2, 3, 4, 5, 6, 0]);
  });

  test("If UI palette is not exactly matched in existing palettes, move the closest match to position 7", () => {
    const inputPalettes: HexPalette[] = [
      ["64a5ff", "ffad63", "9394fe", "000000"],
      ["833100", "ffad63", "8b8cde", "000000"],
      ["5b315b", "f7c4a5", "9394fe", "000000"],
      ["ffe7c5", "f7c4a5", "525252", "000000"],
      ["7bff30", "f7c4a5", "8b8cde", "000000"],
      ["cc0000", "00ee00", "333333", "000000"],
      ["833100", "ffad63", "000000", "000000"],
      ["833100", "008486", "000000", "000000"],
    ];
    const inputMappingTable = [0, 1, 2, 3, 4, 5, 6, 7];
    const { palettes, mappingTable } = setUIPalette(
      {
        palettes: inputPalettes,
        mappingTable: inputMappingTable,
      },
      ["dd0000", "11dd22", "444444", "101010"],
    );
    expect(palettes).toHaveLength(8);
    expect(palettes[0]).toEqual(inputPalettes[0]);
    expect(palettes[1]).toEqual(inputPalettes[1]);
    expect(palettes[2]).toEqual(inputPalettes[2]);
    expect(palettes[3]).toEqual(inputPalettes[3]);
    expect(palettes[4]).toEqual(inputPalettes[4]);
    expect(palettes[5]).toEqual(inputPalettes[7]);
    expect(palettes[6]).toEqual(inputPalettes[6]);
    expect(palettes[7]).toEqual(["dd0000", "11dd22", "444444", "101010"]);
    expect(mappingTable).toEqual([0, 1, 2, 3, 4, 7, 6, 5]);
  });

  test("If UI palette is not provided, return unmodified data", () => {
    const inputPalettes: HexPalette[] = [
      ["64a5ff", "ffad63", "9394fe", "000000"],
      ["833100", "ffad63", "8b8cde", "000000"],
      ["5b315b", "f7c4a5", "9394fe", "000000"],
      ["ffe7c5", "f7c4a5", "525252", "000000"],
      ["7bff30", "f7c4a5", "8b8cde", "000000"],
      ["833100", "5b315b", "9394fe", "000000"],
      ["833100", "ffad63", "000000", "000000"],
      ["833100", "008486", "000000", "000000"],
    ];
    const inputMappingTable = [0, 1, 2, 3, 4, 5, 6, 7];
    const { palettes, mappingTable } = setUIPalette({
      palettes: inputPalettes,
      mappingTable: inputMappingTable,
    });
    expect(palettes).toEqual(inputPalettes);
    expect(mappingTable).toEqual(inputMappingTable);
  });

  test("If best UI palette match is outside of allowed range of 0-7, use the closest match within 0-7", () => {
    const inputPalettes: HexPalette[] = [
      ["64a5ff", "ffad63", "9394fe", "000000"],
      ["cc0000", "00ee00", "333333", "000000"],
      ["2b315b", "f7c4a5", "9394fe", "ffffff"],
      ["5b315b", "f7c4a5", "9394fe", "000000"],
      ["ffe7c5", "f7c4a5", "525252", "000000"],
      ["7bff30", "f7c4a5", "8b8cde", "000000"],
      ["833100", "ffad63", "000000", "000000"],
      ["833100", "008486", "000000", "000000"],
      ["dd0000", "11dd22", "444444", "101010"],
    ];
    const inputMappingTable = [0, 1, 2, 3, 4, 5, 6, 7];
    const { palettes, mappingTable } = setUIPalette(
      {
        palettes: inputPalettes,
        mappingTable: inputMappingTable,
      },
      ["dd0000", "11dd22", "444444", "101010"],
    );
    expect(palettes).toHaveLength(9);
    expect(palettes[0]).toEqual(inputPalettes[0]);
    expect(palettes[1]).toEqual(inputPalettes[7]);
    expect(palettes[2]).toEqual(inputPalettes[2]);
    expect(palettes[3]).toEqual(inputPalettes[3]);
    expect(palettes[4]).toEqual(inputPalettes[4]);
    expect(palettes[5]).toEqual(inputPalettes[5]);
    expect(palettes[6]).toEqual(inputPalettes[6]);
    expect(palettes[7]).toEqual(["dd0000", "11dd22", "444444", "101010"]);
    expect(mappingTable).toEqual([0, 7, 2, 3, 4, 5, 6, 1]);
  });
});
