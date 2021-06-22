import {
  MetaspriteTile,
  Metasprite,
  SpriteState,
  SpriteAnimation,
  ScriptEvent,
} from "../entities/entitiesTypes";

export const ClipboardTypeScriptEvents = "gbstudio.scriptevents";
export const ClipboardTypeMetaspriteTiles = "gbstudio.metaspritetiles";
export const ClipboardTypeMetasprites = "gbstudio.metasprites";
export const ClipboardTypeSpriteState = "gbstudio.spritestate";
export const ClipboardTypePaletteIds = "gbstudio.palettes";

export type NarrowClipboardType<T, N> = T extends { format: N } ? T : never;

export type ClipboardMetaspriteTiles = {
  metaspriteTiles: MetaspriteTile[];
};

export type ClipboardMetasprites = {
  metasprites: Metasprite[];
  metaspriteTiles: MetaspriteTile[];
};

export type ClipboardSpriteState = {
  spriteState: SpriteState;
  animations: SpriteAnimation[];
  metasprites: Metasprite[];
  metaspriteTiles: MetaspriteTile[];
};

export type ClipboardPaletteIds = {
  paletteIds: string[];
};

export type ClipboardScriptEvents = {
  scriptEvents: ScriptEvent[];
  script: string[];
};

export type ClipboardType =
  | {
      format: typeof ClipboardTypeMetaspriteTiles;
      data: ClipboardMetaspriteTiles;
    }
  | {
      format: typeof ClipboardTypeMetasprites;
      data: ClipboardMetasprites;
    }
  | {
      format: typeof ClipboardTypeSpriteState;
      data: ClipboardSpriteState;
    }
  | {
      format: typeof ClipboardTypePaletteIds;
      data: ClipboardPaletteIds;
    }
  | {
      format: typeof ClipboardTypeScriptEvents;
      data: ClipboardScriptEvents;
    };

export type ClipboardFormat = ClipboardType["format"];

export const ClipboardTypes: ClipboardFormat[] = [
  ClipboardTypeMetaspriteTiles,
  ClipboardTypeMetasprites,
  ClipboardTypeSpriteState,
  ClipboardTypePaletteIds,
  ClipboardTypeScriptEvents,
];
