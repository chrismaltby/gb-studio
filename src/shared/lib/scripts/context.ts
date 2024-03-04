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
