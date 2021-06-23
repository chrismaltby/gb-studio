import React from "react";
import { ScriptEventParentType } from "store/features/entities/entitiesTypes";
import AddButton from "./AddButton";
import ScriptEditorEvent from "./ScriptEditorEvent2";

interface ScriptEditorProps {
  value: string[];
  type: ScriptEventParentType;
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
      <AddButton parentType={type} parentId={entityId} parentKey={scriptKey} />
    </div>
  );
};

export default ScriptEditor;
