import { clipboard } from "electron";
import {
  ClipboardFormat,
  ClipboardMetasprites,
  ClipboardMetaspriteTiles,
  ClipboardType,
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
  ClipboardTypes,
  NarrowClipboardType,
} from "./clipboardTypes";

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

export const paste = <T extends ClipboardFormat>(
  format: T
): NarrowClipboardType<ClipboardType, T> | undefined => {
  const buffer = clipboard.readBuffer(format);

  let data;
  try {
    data = JSON.parse(buffer?.toString?.());
  } catch (e) {
    return undefined;
  }

  if (format === ClipboardTypeMetaspriteTiles) {
    if (isClipboardMetaspriteTiles(data)) {
      return {
        format: ClipboardTypeMetaspriteTiles,
        data,
      } as NarrowClipboardType<ClipboardType, T>;
    }
    return undefined;
  } else if (format === ClipboardTypeMetasprites) {
    if (isClipboardMetasprites(data)) {
      return {
        format: ClipboardTypeMetasprites,
        data,
      } as NarrowClipboardType<ClipboardType, T>;
    }
    return undefined;
  }
  return undefined;
};

export const pasteAny = (): ClipboardType | undefined => {
  for (const type of ClipboardTypes) {
    const data = paste(type);
    if (data) {
      return data;
    }
  }
  return undefined;
};
