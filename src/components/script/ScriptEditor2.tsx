import React from "react";
import ScriptEditorEvent from "./ScriptEditorEvent2";

interface ScriptEditorProps {
  value: string[];
  type: "scene";
  entityId: string;
  scriptKey: string;
}

const ScriptEditor = ({
  value,
  type,
  entityId,
  scriptKey,
}: ScriptEditorProps) => {
  return (
    <div>
      {value.map((id, index) => (
        <ScriptEditorEvent
          key={id}
          id={id}
          index={index}
          parentType={type}
          parentId={entityId}
          parentKey={scriptKey}
          entityId={entityId}
        />
      ))}
    </div>
  );
};

export default ScriptEditor;
