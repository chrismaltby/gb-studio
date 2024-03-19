import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";
import {
  customEventSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import styled from "styled-components";
import AddButton from "./AddButton";
import ScriptEditorEvent from "./ScriptEditorEvent";
import { ScriptEventAutoFade } from "./ScriptEventAutoFade";
import { calculateAutoFadeEventIdNormalized } from "shared/lib/scripts/eventHelpers";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";

interface ScriptEditorProps {
  value: string[];
  showAutoFadeIndicator?: boolean;
}

const ScriptEditorWrapper = styled.div`
  position: relative;
`;

const ScriptEditor = React.memo(
  ({ value, showAutoFadeIndicator }: ScriptEditorProps) => {
    const context = useContext(ScriptEditorContext);
    const [renderTo, setRenderTo] = useState(0);
    const timerRef = useRef<number>(0);
    const scriptEventsLookup = useAppSelector((state) =>
      scriptEventSelectors.selectEntities(state)
    );
    const customEventsLookup = useAppSelector((state) =>
      customEventSelectors.selectEntities(state)
    );
    const scriptEventDefs = useAppSelector((state) =>
      selectScriptEventDefs(state)
    );
    const autoFadeEventId = useMemo(() => {
      return showAutoFadeIndicator
        ? calculateAutoFadeEventIdNormalized(
            value,
            scriptEventsLookup,
            customEventsLookup,
            scriptEventDefs
          )
        : "";
    }, [
      customEventsLookup,
      scriptEventDefs,
      scriptEventsLookup,
      showAutoFadeIndicator,
      value,
    ]);

    // Reset renderTo on script tab change
    useEffect(() => {
      setRenderTo(0);
    }, [context.entityId, context.scriptKey]);

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
    }, [renderTo, value.length, context.entityId, context.scriptKey]);

    return (
      <ScriptEditorWrapper>
        {value.map(
          (id, index) =>
            index < renderTo && (
              <React.Fragment key={`event_row_${id}_${index}`}>
                {showAutoFadeIndicator && id === autoFadeEventId && (
                  <ScriptEventAutoFade />
                )}
                <ScriptEditorEvent
                  key={`${id}_${index}`}
                  id={id}
                  index={index}
                  parentType={context.entityType}
                  parentId={context.entityId}
                  parentKey={context.scriptKey}
                  entityId={context.entityId}
                />
              </React.Fragment>
            )
        )}
        {showAutoFadeIndicator && autoFadeEventId === "" && (
          <ScriptEventAutoFade />
        )}
        <AddButton
          parentType={context.entityType}
          parentId={context.entityId}
          parentKey={context.scriptKey}
        />
      </ScriptEditorWrapper>
    );
  }
);

export default ScriptEditor;
