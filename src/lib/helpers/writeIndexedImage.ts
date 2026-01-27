import { writeFile } from "fs-extra";
import { PNG } from "pngjs";
import { IndexedImage } from "shared/lib/tiles/indexedImage";

export const writeIndexedImagePNG = async (
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
