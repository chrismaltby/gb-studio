import React from "react";
import { ScriptEditorCtx } from "shared/lib/scripts/context";

export const ScriptEditorContext = React.createContext<ScriptEditorCtx>({
  type: "entity",
  entityType: "scene",
  sceneId: "",
  entityId: "",
  scriptKey: "",
});
