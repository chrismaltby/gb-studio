import type { ScriptEditorCtxType } from "shared/lib/resources/types";

export type EntityType =
  | "scene"
  | "actor"
  | "trigger"
  | "customEvent"
  | "actorPrefab";

export type ScriptEditorCtx = {
  type: ScriptEditorCtxType;
  sceneId: string;
  entityId: string;
  entityType: EntityType;
  scriptKey: string;
  executingId?: string;
};

export const defaultVariableForContext = (
  context: ScriptEditorCtxType
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
