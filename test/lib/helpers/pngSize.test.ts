import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import Path from "path";
import { PNG } from "pngjs";
import pngSize from "lib/helpers/pngSize";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

test("reads PNG dimensions from the file header", async () => {
  const tmpDir = await mkdtemp(Path.join(os.tmpdir(), "png-size-"));
  const filename = Path.join(tmpDir, "image.png");

  try {
    const png = new PNG({ width: 17, height: 23 });
    await writeFile(filename, PNG.sync.write(png));

    await expect(pngSize(filename)).resolves.toEqual({
      width: 17,
      height: 23,
    });
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test("reads PNG dimensions from a CgBI-prefixed file header", async () => {
  const tmpDir = await mkdtemp(Path.join(os.tmpdir(), "png-size-"));
  const filename = Path.join(tmpDir, "image.png");

  try {
    const header = Buffer.alloc(40);
    PNG_SIGNATURE.copy(header, 0);
    header.writeUInt32BE(4, 8);
    header.write("CgBI", 12, "ascii");
    header.writeUInt32BE(0, 16);
    header.writeUInt32BE(13, 24);
    header.write("IHDR", 28, "ascii");
    header.writeUInt32BE(19, 32);
    header.writeUInt32BE(29, 36);
    await writeFile(filename, header);

    await expect(pngSize(filename)).resolves.toEqual({
      width: 19,
      height: 29,
    });
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test("rejects files that are not PNG images", async () => {
  const tmpDir = await mkdtemp(Path.join(os.tmpdir(), "png-size-"));
  const filename = Path.join(tmpDir, "image.txt");

  try {
    await writeFile(filename, "not png");

    await expect(pngSize(filename)).rejects.toThrow("Invalid PNG");
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test("rejects files with an invalid PNG signature", async () => {
  const tmpDir = await mkdtemp(Path.join(os.tmpdir(), "png-size-"));
  const filename = Path.join(tmpDir, "image.png");

  try {
    await writeFile(filename, Buffer.alloc(40));

    await expect(pngSize(filename)).rejects.toThrow("Invalid PNG");
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});
