export type EntityType =
  | "scene"
  | "actor"
  | "trigger"
  | "customEvent"
  | "actorPrefab";

export type ScriptEditorCtx = {
  type: "entity" | "script" | "global";
  sceneId: string;
  entityId: string;
  entityType: EntityType;
  scriptKey: string;
  executingId?: string;
};

export type ScriptEditorContextType = "entity" | "script" | "global";

export const defaultVariableForContext = (
  context: ScriptEditorContextType
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
