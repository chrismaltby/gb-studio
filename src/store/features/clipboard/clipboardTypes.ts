import {
  MetaspriteNormalized,
  SpriteStateNormalized,
  SpriteAnimationNormalized,
  ScriptEventNormalized,
  TriggerNormalized,
  ActorNormalized,
  SceneNormalized,
  CustomEventNormalized,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import { MetaspriteTile, Variable } from "shared/lib/resources/types";
import { ScriptValue } from "shared/lib/scriptValue/types";

export const ClipboardTypeScriptEvents = "gbstudio.scriptevents";
export const ClipboardTypeMetaspriteTiles = "gbstudio.metaspritetiles";
export const ClipboardTypeMetasprites = "gbstudio.metasprites";
export const ClipboardTypeSpriteState = "gbstudio.spritestate";
export const ClipboardTypePaletteIds = "gbstudio.palettes";
export const ClipboardTypeTriggers = " gbstudio.triggers";
export const ClipboardTypeActors = " gbstudio.actors";
export const ClipboardTypeScenes = " gbstudio.scenes";
export const ClipboardTypeScriptValue = " gbstudio.value";

export type NarrowClipboardType<T, N> = T extends { format: N } ? T : never;

export type ClipboardMetaspriteTiles = {
  metaspriteTiles: MetaspriteTile[];
};

export type ClipboardMetasprites = {
  metasprites: MetaspriteNormalized[];
  metaspriteTiles: MetaspriteTile[];
};

export type ClipboardSpriteState = {
  spriteState: SpriteStateNormalized;
  animations: SpriteAnimationNormalized[];
  metasprites: MetaspriteNormalized[];
  metaspriteTiles: MetaspriteTile[];
};

export type ClipboardPaletteIds = {
  paletteIds: string[];
};

export type ClipboardScriptEvents = {
  scriptEvents: ScriptEventNormalized[];
  script: string[];
  customEvents: CustomEventNormalized[];
};

export type ClipboardTriggers = {
  triggers: TriggerNormalized[];
  scriptEvents: ScriptEventNormalized[];
  variables: Variable[];
  customEvents: CustomEventNormalized[];
  triggerPrefabs?: TriggerPrefabNormalized[];
};

export type ClipboardActors = {
  actors: ActorNormalized[];
  scriptEvents: ScriptEventNormalized[];
  variables: Variable[];
  customEvents: CustomEventNormalized[];
  actorPrefabs?: ActorPrefabNormalized[];
};

export type ClipboardScenes = {
  scenes: SceneNormalized[];
  actors: ActorNormalized[];
  triggers: TriggerNormalized[];
  scriptEvents: ScriptEventNormalized[];
  variables: Variable[];
  customEvents: CustomEventNormalized[];
  actorPrefabs?: ActorPrefabNormalized[];
  triggerPrefabs?: TriggerPrefabNormalized[];
};

export type ClipboardScriptValue = {
  value: ScriptValue;
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
    }
  | {
      format: typeof ClipboardTypeTriggers;
      data: ClipboardTriggers;
    }
  | {
      format: typeof ClipboardTypeActors;
      data: ClipboardActors;
    }
  | {
      format: typeof ClipboardTypeScenes;
      data: ClipboardScenes;
    }
  | {
      format: typeof ClipboardTypeScriptValue;
      data: ClipboardScriptValue;
    };

export type ClipboardFormat = ClipboardType["format"];

export const ClipboardTypes: ClipboardFormat[] = [
  ClipboardTypeMetaspriteTiles,
  ClipboardTypeMetasprites,
  ClipboardTypeSpriteState,
  ClipboardTypePaletteIds,
  ClipboardTypeScriptEvents,
  ClipboardTypeTriggers,
  ClipboardTypeActors,
  ClipboardTypeScenes,
  ClipboardTypeScriptValue,
];
