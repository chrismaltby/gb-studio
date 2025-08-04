import type {
  SpriteModeSetting,
  ScriptEditorCtxType,
} from "shared/lib/resources/types";

export type EntityType =
  | "scene"
  | "actor"
  | "trigger"
  | "customEvent"
  | "actorPrefab"
  | "triggerPrefab";

export type ScriptEditorCtx = {
  type: ScriptEditorCtxType;
  sceneId: string;
  entityId: string;
  entityType: EntityType;
  scriptKey: string;
  executingId?: string;
  instanceId?: string;
};

export const defaultVariableForContext = (
  context: ScriptEditorCtxType,
): string => {
  if (context === "script") {
    return "V0";
  }
  if (context === "entity") {
    return "L0";
  } else {
    return "0";
  }
};

export type SceneCtx = {
  spriteMode?: SpriteModeSetting;
};
