import React from "react";
import ScriptEditorEvent from "./ScriptEditorEvent2";

interface ScriptEditorProps {
  value: string[];
  type: "scene";
  onChange: (newValue: string[]) => void;
  entityId: string;
}

const ScriptEditor = ({
  value,
  type,
  onChange,
  entityId,
}: ScriptEditorProps) => {
  return (
    <div>
      {value.map((id) => (
        <ScriptEditorEvent key={id} id={id} />
      ))}
    </div>
  );
};

export default ScriptEditor;
