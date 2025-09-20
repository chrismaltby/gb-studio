import React, { useMemo } from "react";
import { useAppSelector } from "store/hooks";
import { customEventSelectors } from "store/features/entities/entitiesState";
import {
  CustomEventNormalized,
  ScriptEventFieldSchema,
  ScriptEventNormalized,
  ScriptEventParentType,
} from "shared/lib/entities/entitiesTypes";
import ScriptEventFields from "./ScriptEventFields";
import type { ScriptEventDef } from "lib/scriptEventsHandlers/handlerTypes";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";

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

const getScriptEventFields = (
  command: string,
  value: { customEventId?: string; engineFieldKey?: string },
  customEvents: Record<string, CustomEventNormalized>,
  scriptEventDefs: Record<string, ScriptEventDef>,
) => {
  const eventCommands =
    (scriptEventDefs[command] && scriptEventDefs[command]?.fields) || [];
  if (value.customEventId && customEvents[value.customEventId]) {
    const customEvent = customEvents[value.customEventId];
    const description = customEvent?.description
      ? [
          {
            label: customEvent.description
              .split("\n")
              .map((text, index) => (
                <div key={index}>{text || <div>&nbsp;</div>}</div>
              )),
          },
          {
            type: "break",
          },
        ]
      : [];
    const usedVariables =
      Object.values(customEvent?.variables || []).map((v) => {
        return {
          label: `${v?.name || ""}`,
          key: `$variable[${v?.id || ""}]$`,
          type: "value",
          defaultValue: {
            type: "variable",
            value: "0",
          },
        };
      }) || [];
    const usedActors =
      Object.values(customEvent?.actors || []).map((a) => {
        return {
          label: `${a?.name || ""}`,
          defaultValue: "player",
          key: `$actor[${a?.id || ""}]$`,
          type: "actor",
        };
      }) || [];

    return ([] as ScriptEventFieldSchema[]).concat(
      eventCommands,
      description,
      usedVariables,
      usedActors,
    );
  }

  return eventCommands;
};

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
