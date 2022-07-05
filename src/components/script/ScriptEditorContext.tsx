import React from "react";

export type ScriptEditorContextType = "entity" | "script" | "global";

export const ScriptEditorContext =
  React.createContext<ScriptEditorContextType>("entity");
