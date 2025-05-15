import AddButton from "components/script/AddButton";
import ScriptEditorEvent from "components/script/ScriptEditorEvent";
import React, { useRef } from "react";
import { ScriptEditorChildren } from "ui/scripting/ScriptEvents";
import useOnScreen from "ui/hooks/use-on-screen";
import { useScriptEventTitle } from "components/script/hooks/useScriptEventTitle";
import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";

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
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);
  const eventLabel = useScriptEventTitle(
    scriptEvent?.command ?? "",
    scriptEvent?.args ?? {},
    isVisible
  );
  const title = `${label}${eventLabel && label ? " : " : ""}${eventLabel}`;
  const children = scriptEvent?.children?.[parentKey] || [];

  return (
    <ScriptEditorChildren
      ref={ref}
      label={title}
      shortLabel={label}
      title={title}
      nestLevel={nestLevel}
    >
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
    </ScriptEditorChildren>
  );
};
