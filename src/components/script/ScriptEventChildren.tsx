import AddButton from "components/script/AddButton";
import ScriptEditorEvent from "components/script/ScriptEditorEvent";
import React from "react";
import {
  ScriptEditorChildren,
  ScriptEditorChildrenBorder,
  ScriptEditorChildrenLabel,
  ScriptEditorChildrenWrapper,
} from "ui/scripting/ScriptEvents";
import useOnScreen from "ui/hooks/use-on-screen";
import { useScriptEventTitle } from "components/script/hooks/useScriptEventTitle";
import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";
import useResizeObserver from "ui/hooks/use-resize-observer";

interface ScriptEventChildrenProps {
  nestLevel: number;
  label: string;
  entityId: string;
  parentId: string;
  parentKey: string;
  scriptEvent?: ScriptEventNormalized;
}

export const ScriptEventChildren = ({
  nestLevel,
  label,
  entityId,
  parentId,
  parentKey,
  scriptEvent,
}: ScriptEventChildrenProps) => {
  const [ref, size] = useResizeObserver<HTMLDivElement>();
  const isVisible = useOnScreen(ref);
  const eventLabel = useScriptEventTitle(
    scriptEvent?.command ?? "",
    scriptEvent?.args ?? {},
    isVisible
  );
  const title = `${label}${eventLabel && label ? " : " : ""}${eventLabel}`;
  const children = scriptEvent?.children?.[parentKey] || [];
  const showLabel = size.height !== undefined;
  const showFullLabel = size.height && size.height > 200;
  const labelText = showFullLabel ? title : label;
  const labelMaxHeight = Math.max(80, size.height ? size.height : 0);

  return (
    <ScriptEditorChildren nestLevel={nestLevel}>
      <ScriptEditorChildrenBorder
        title={title}
        nestLevel={nestLevel}
        style={{ maxHeight: labelMaxHeight }}
      >
        {showLabel && labelText && (
          <ScriptEditorChildrenLabel nestLevel={nestLevel}>
            <span
              style={{
                maxHeight: labelMaxHeight - 30,
              }}
            >
              {labelText}
            </span>
          </ScriptEditorChildrenLabel>
        )}
      </ScriptEditorChildrenBorder>

      <ScriptEditorChildrenWrapper ref={ref}>
        {children.map((child, childIndex) => (
          <ScriptEditorEvent
            key={`${child}_${childIndex}`}
            id={child}
            index={childIndex}
            nestLevel={nestLevel + 1}
            parentType="scriptEvent"
            parentId={parentId}
            parentKey={parentKey}
            entityId={entityId}
          />
        ))}
        <AddButton
          parentType="scriptEvent"
          parentId={parentId}
          parentKey={parentKey}
          nestLevel={nestLevel}
          conditional={true}
        />
      </ScriptEditorChildrenWrapper>
    </ScriptEditorChildren>
  );
};
