import { clipboard } from "electron";
import { Metasprite, MetaspriteTile } from "../entities/entitiesTypes";

type NarrowClipboardType<T, N> = T extends { format: N } ? T : never;

type ClipboardMetaspriteTiles = {
  metaspriteTiles: MetaspriteTile[];
};

type ClipboardMetasprites = {
  metasprites: Metasprite[];
  metaspriteTiles: MetaspriteTile[];
};

type ClipboardType =
  | {
      format: "gbstudio.metaspritetiles";
      data: ClipboardMetaspriteTiles;
    }
  | {
      format: "gbstudio.metasprites";
      data: ClipboardMetasprites;
    };

type CopyFormat = ClipboardType["format"];

const isClipboardMetaspriteTiles = (
  input: any
): input is ClipboardMetaspriteTiles => {
  return Array.isArray(input?.metaspriteTiles);
};

const isClipboardMetasprites = (input: any): input is ClipboardMetasprites => {
  return (
    Array.isArray(input?.metasprites) && Array.isArray(input?.metaspriteTiles)
  );
};

export const copy = (payload: ClipboardType) => {
  const buffer = Buffer.from(JSON.stringify(payload.data), "utf8");
  clipboard.writeBuffer(payload.format, buffer);
};

export const paste = <T extends CopyFormat>(
  format: T
): NarrowClipboardType<ClipboardType, T>["data"] | undefined => {
  const buffer = clipboard.readBuffer(format);

  let data;
  try {
    data = JSON.parse(buffer?.toString?.());
  } catch (e) {
    return undefined;
  }

  if (format === "gbstudio.metaspritetiles") {
    if (isClipboardMetaspriteTiles(data)) {
      return data;
    }
    return undefined;
  } else if (format === "gbstudio.metasprites") {
    if (isClipboardMetasprites(data)) {
      return data;
    }
    return undefined;
  }
  return undefined;
};
