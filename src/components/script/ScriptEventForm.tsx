import React, { useMemo } from "react";
import { useAppSelector } from "store/hooks";
import {
  customEventSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import { Dictionary } from "@reduxjs/toolkit";
import {
  CustomEventNormalized,
  ScriptEventFieldSchema,
} from "shared/lib/entities/entitiesTypes";
import ScriptEventFields from "./ScriptEventFields";
import type { ScriptEventDef } from "lib/project/loadScriptEventHandlers";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";

interface ScriptEventFormProps {
  id: string;
  entityId: string;
  nestLevel: number;
  altBg: boolean;
  renderEvents: (key: string, label: string) => React.ReactNode;
}

const getScriptEventFields = (
  command: string,
  value: { customEventId?: string; engineFieldKey?: string },
  customEvents: Dictionary<CustomEventNormalized>,
  scriptEventDefs: Dictionary<ScriptEventDef>
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
      usedActors
    );
  }

  return eventCommands;
};

const ScriptEventForm = ({
  id,
  entityId,
  nestLevel,
  altBg,
  renderEvents,
}: ScriptEventFormProps) => {
  const scriptEventDefs = useAppSelector((state) =>
    selectScriptEventDefs(state)
  );
  const scriptEvent = useAppSelector((state) =>
    scriptEventSelectors.selectById(state, id)
  );
  const customEvents = useAppSelector((state) =>
    customEventSelectors.selectEntities(state)
  );
  const command = scriptEvent?.command;
  const value = scriptEvent?.args;

  const fields = useMemo(() => {
    if (command) {
      return getScriptEventFields(
        command,
        value || {},
        customEvents,
        scriptEventDefs
      );
    }
    return [];
  }, [command, value, customEvents, scriptEventDefs]);

  if (!scriptEvent) {
    return null;
  }

  return (
    <ScriptEventFields
      id={id}
      entityId={entityId}
      nestLevel={nestLevel}
      altBg={altBg}
      renderEvents={renderEvents}
      fields={fields}
      value={value}
    />
  );
};

export default ScriptEventForm;
