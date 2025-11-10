import { PNG } from "pngjs";
import { writeFile } from "fs-extra";
import { readFileToPalettes } from "lib/tiles/readFileToPalettes";
import {
  IndexedImage,
  pixelDataToIndexedImage,
} from "shared/lib/tiles/indexedImage";
import { extractTilePaletteWithHint } from "shared/lib/tiles/autoColor";
import { tileDataIndexFn } from "shared/lib/tiles/tileData";

test("Should reduce the palettes to a maximum of 8", async () => {
  const filename = `${__dirname}/_files/test/color_town.png`;
  const paletteData = await readFileToPalettes(filename, "default");
  writeIndexedImagePNG(
    `${__dirname}/_tmp/color_town_tiles.png`,
    paletteData.indexedImage,
  );
});

test("Should reduce the palettes to a maximum of 8", async () => {
  const filename = `${__dirname}/_files/test/parallax_color.png`;
  const paletteData = await readFileToPalettes(filename, "default");
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
