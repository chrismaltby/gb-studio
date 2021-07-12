import React, { useEffect, useRef, useState } from "react";
import { ScriptEventParentType } from "store/features/entities/entitiesTypes";
import styled from "styled-components";
import AddButton from "./AddButton";
import ScriptEditorEvent from "./ScriptEditorEvent";

interface ScriptEditorProps {
  value: string[];
  type: ScriptEventParentType;
  entityId: string;
  scriptKey: string;
}

const ScriptEditorWrapper = styled.div`
  position: relative;
`;

const ScriptEditor = React.memo(
  ({ value, type, entityId, scriptKey }: ScriptEditorProps) => {
    const [renderTo, setRenderTo] = useState(0);
    const timerRef = useRef<number>(0);

    // Reset renderTo on script tab change
    useEffect(() => {
      setRenderTo(0);
    }, [scriptKey]);

    // Load long scripts asynchronously
    useEffect(() => {
      if (value.length >= renderTo) {
        timerRef.current = setTimeout(() => {
          setRenderTo(renderTo + 1);
        }, 1);
        return () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
        };
      }
    }, [renderTo, value.length]);

    return (
      <ScriptEditorWrapper>
        {value.map(
          (id, index) =>
            index < renderTo && (
              <ScriptEditorEvent
                key={id}
                id={id}
                index={index}
                parentType={type}
                parentId={entityId}
                parentKey={scriptKey}
                entityId={entityId}
              />
            )
        )}
        <AddButton
          parentType={type}
          parentId={entityId}
          parentKey={scriptKey}
        />
      </ScriptEditorWrapper>
    );
  }
);

export default ScriptEditor;
