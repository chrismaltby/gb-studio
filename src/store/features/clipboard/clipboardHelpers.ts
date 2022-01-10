import { remote } from "electron";
import {
  ClipboardActors,
  ClipboardFormat,
  ClipboardMetasprites,
  ClipboardMetaspriteTiles,
  ClipboardPaletteIds,
  ClipboardScenes,
  ClipboardScriptEvents,
  ClipboardSpriteState,
  ClipboardTriggers,
  ClipboardType,
  ClipboardTypeActors,
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
  ClipboardTypePaletteIds,
  ClipboardTypes,
  ClipboardTypeScenes,
  ClipboardTypeScriptEvents,
  ClipboardTypeSpriteState,
  ClipboardTypeTriggers,
  NarrowClipboardType,
} from "./clipboardTypes";

export const clipboard = remote.clipboard;

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
  const wide: { scriptEvents?: unknown; script?: unknown } = input;
  return Array.isArray(wide.scriptEvents) && Array.isArray(wide.script);
};

const isClipboardTriggers = (input: unknown): input is ClipboardTriggers => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const wide: { scriptEvents?: unknown; triggers?: unknown } = input;
  return Array.isArray(wide.scriptEvents) && Array.isArray(wide.triggers);
};

const isClipboardActors = (input: unknown): input is ClipboardActors => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const wide: { scriptEvents?: unknown; actors?: unknown } = input;
  return Array.isArray(wide.scriptEvents) && Array.isArray(wide.actors);
};

const isClipboardScenes = (input: unknown): input is ClipboardScenes => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const wide: {
    scriptEvents?: unknown;
    actors?: unknown;
    triggers?: unknown;
    scenes?: unknown;
  } = input;
  return (
    Array.isArray(wide.scriptEvents) &&
    Array.isArray(wide.actors) &&
    Array.isArray(wide.triggers) &&
    Array.isArray(wide.scenes)
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
  } else if (format === ClipboardTypeTriggers) {
    if (isClipboardTriggers(data)) {
      return {
        format: ClipboardTypeTriggers,
        data,
      } as NarrowClipboardType<ClipboardType, T>;
    }
  } else if (format === ClipboardTypeActors) {
    if (isClipboardActors(data)) {
      return {
        format: ClipboardTypeActors,
        data,
      } as NarrowClipboardType<ClipboardType, T>;
    }
  } else if (format === ClipboardTypeScenes) {
    if (isClipboardScenes(data)) {
      return {
        format: ClipboardTypeScenes,
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
