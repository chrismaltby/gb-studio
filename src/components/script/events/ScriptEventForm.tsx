import React, { useMemo } from "react";
import { useAppSelector } from "store/hooks";
import { customEventSelectors } from "store/features/entities/entitiesSelectors";
import {
  ScriptEventNormalized,
  ScriptEventParentType,
} from "shared/lib/entities/entitiesTypes";
import ScriptEventFields from "./ScriptEventFields";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { getScriptEventFields } from "./scriptEventFormFields";

interface ScriptEventFormProps {
  scriptEvent: ScriptEventNormalized;
  entityId: string;
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
  nestLevel: number;
  altBg: boolean;
  renderEvents: (key: string, label: string) => React.ReactNode;
}

const ScriptEventForm = ({
  scriptEvent,
  entityId,
  parentId,
  parentKey,
  parentType,
  nestLevel,
  altBg,
  renderEvents,
}: ScriptEventFormProps) => {
  const scriptEventDefs = useAppSelector((state) =>
    selectScriptEventDefs(state),
  );
  const customEvents = useAppSelector((state) =>
    customEventSelectors.selectEntities(state),
  );
  const command = scriptEvent?.command;
  const value = scriptEvent?.args;

  const fields = useMemo(() => {
    if (command) {
      return getScriptEventFields(
        command,
        value || {},
        customEvents,
        scriptEventDefs,
      );
    }
    return [];
  }, [command, value, customEvents, scriptEventDefs]);

  if (!scriptEvent) {
    return null;
  }

  return (
    <ScriptEventFields
      scriptEvent={scriptEvent}
      entityId={entityId}
      parentId={parentId}
      parentKey={parentKey}
      parentType={parentType}
      nestLevel={nestLevel}
      altBg={altBg}
      renderEvents={renderEvents}
      fields={fields}
      value={value}
    />
  );
};

export default ScriptEventForm;
