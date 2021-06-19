import React, { useState } from "react";
import ScriptEditorEvent from "./ScriptEditorEvent2";

interface ScriptEditorProps {
  value: string[];
  type: "scene";
  onChange: (newValue: string[]) => void;
  entityId: string;
  scriptKey: string;
}

const ScriptEditor = ({
  value,
  type,
  entityId,
  scriptKey,
}: ScriptEditorProps) => {
  const [dropId, setDropId] = useState("");
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
          dropId={dropId}
          setDropId={setDropId}
        />
      ))}
    </div>
  );
};

export default ScriptEditor;
