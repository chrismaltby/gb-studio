import React from "react";

export type ScriptEditorContextType = "entity" | "script" | "global";

export const ScriptEditorContext =
  React.createContext<ScriptEditorContextType>("entity");

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
