import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  customEventSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import { RootState } from "store/configureStore";
import { Dictionary } from "@reduxjs/toolkit";
import {
  CustomEvent,
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
  customEvents: Dictionary<CustomEvent>,
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
          type: "union",
          types: ["number", "variable"],
          defaultType: "variable",
          min: -32768,
          max: 32767,
          defaultValue: {
            number: 0,
            variable: "LAST_VARIABLE",
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
  const scriptEventDefs = useSelector((state: RootState) =>
    selectScriptEventDefs(state)
  );
  const scriptEvent = useSelector((state: RootState) =>
    scriptEventSelectors.selectById(state, id)
  );
  const customEvents = useSelector((state: RootState) =>
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
