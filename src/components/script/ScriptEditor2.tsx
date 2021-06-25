import React from "react";
import { ScriptEventParentType } from "store/features/entities/entitiesTypes";
import styled from "styled-components";
import AddButton from "./AddButton";
import ScriptEditorEvent from "./ScriptEditorEvent2";

interface ScriptEditorProps {
  value: string[];
  type: ScriptEventParentType;
  entityId: string;
  scriptKey: string;
}

const ScriptEditorWrapper = styled.div`
  position: relative;
`;

const ScriptEditor = ({
  value,
  type,
  entityId,
  scriptKey,
}: ScriptEditorProps) => {
  return (
    <ScriptEditorWrapper>
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
    </ScriptEditorWrapper>
  );
};

export default ScriptEditor;
