import { clipboard } from "electron";
import {
  ClipboardFormat,
  ClipboardMetasprites,
  ClipboardMetaspriteTiles,
  ClipboardPaletteIds,
  ClipboardScriptEvents,
  ClipboardSpriteState,
  ClipboardType,
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
  ClipboardTypePaletteIds,
  ClipboardTypes,
  ClipboardTypeScriptEvents,
  ClipboardTypeSpriteState,
  NarrowClipboardType,
} from "./clipboardTypes";

const isClipboardMetaspriteTiles = (
  input: unknown
): input is ClipboardMetaspriteTiles => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const wide: { metaspriteTiles?: unknown } = input;
  return Array.isArray(wide.metaspriteTiles);
};

const isClipboardMetasprites = (
  input: unknown
): input is ClipboardMetasprites => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const wide: { metasprites?: unknown; metaspriteTiles?: unknown } = input;
  return Array.isArray(wide.metasprites) && Array.isArray(wide.metaspriteTiles);
};

const isClipboardSpriteState = (
  input: unknown
): input is ClipboardSpriteState => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const wide: {
    metasprites?: unknown;
    metaspriteTiles?: unknown;
    animations?: unknown;
    spriteState?: unknown;
  } = input;
  return (
    Array.isArray(wide.metasprites) &&
    Array.isArray(wide.metaspriteTiles) &&
    Array.isArray(wide.animations) &&
    typeof wide.spriteState === "object"
  );
};

const isClipboardPaletteIds = (
  input: unknown
): input is ClipboardPaletteIds => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const wide: { paletteIds?: unknown } = input;
  return Array.isArray(wide.paletteIds);
};

const isClipboardScriptEvents = (
  input: unknown
): input is ClipboardScriptEvents => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const wide: { scriptEvents?: unknown } = input;
  return Array.isArray(wide.scriptEvents);
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
  } else if (format === ClipboardTypeSpriteState) {
    if (isClipboardSpriteState(data)) {
      return {
        format: ClipboardTypeSpriteState,
        data,
      } as NarrowClipboardType<ClipboardType, T>;
    }
    return undefined;
  } else if (format === ClipboardTypePaletteIds) {
    if (isClipboardPaletteIds(data)) {
      return {
        format: ClipboardTypePaletteIds,
        data,
      } as NarrowClipboardType<ClipboardType, T>;
    }
  } else if (format === ClipboardTypeScriptEvents) {
    if (isClipboardScriptEvents(data)) {
      return {
        format: ClipboardTypeScriptEvents,
        data,
      } as NarrowClipboardType<ClipboardType, T>;
    }
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
