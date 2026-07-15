import { open } from "fs/promises";

export type PNGSize = {
  width: number;
  height: number;
};

const CGBI_HEADER_SIZE = 40;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const readHeader = async (
  filename: string,
  length: number,
): Promise<Buffer> => {
  const file = await open(filename, "r");
  try {
    const buffer = Buffer.alloc(length);

    let offset = 0;
    while (offset < length) {
      const { bytesRead } = await file.read(
        buffer,
        offset,
        length - offset,
        offset,
      );

      if (bytesRead === 0) {
        throw new TypeError("Invalid PNG");
      }

      offset += bytesRead;
    }

    return buffer;
  } finally {
    await file.close();
  }
};

export const pngSize = async (filename: string): Promise<PNGSize> => {
  const header = await readHeader(filename, CGBI_HEADER_SIZE);

  if (!header.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new TypeError("Invalid PNG");
  }

  const firstChunk = header.toString("ascii", 12, 16);

  if (firstChunk === "CgBI") {
    if (header.toString("ascii", 28, 32) !== "IHDR") {
      throw new TypeError("Invalid PNG");
    }
    return {
      width: header.readUInt32BE(32),
      height: header.readUInt32BE(36),
    };
  }

  if (firstChunk !== "IHDR") {
    throw new TypeError("Invalid PNG");
  }

  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
};

export default pngSize;
