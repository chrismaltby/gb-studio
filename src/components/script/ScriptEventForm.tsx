import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  customEventSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import { RootState } from "store/configureStore";
import { Dictionary } from "@reduxjs/toolkit";
import { EngineFieldSchema } from "store/features/engine/engineState";
import {
  CustomEvent,
  ScriptEventFieldSchema,
} from "shared/lib/entities/entitiesTypes";
import ScriptEventFields from "./ScriptEventFields";
import { EVENT_ENGINE_FIELD_SET, EVENT_ENGINE_FIELD_STORE } from "consts";
import type { ScriptEventDef } from "lib/project/loadScriptEvents";
import { selectScriptEventDefsLookup } from "store/features/scriptEventDefs/scriptEventDefsState";

const engineFieldUpdateEvents: Dictionary<ScriptEventDef> = {};
const engineFieldStoreEvents: Dictionary<ScriptEventDef> = {};
console.warn(
  "@TODO Move engineField events to redux store" as any /*So this turns up in linter */
);

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
  engineFields: EngineFieldSchema[],
  scriptEventDefsLookup: Dictionary<ScriptEventDef>
) => {
  const eventCommands =
    (scriptEventDefsLookup[command] &&
      scriptEventDefsLookup[command]?.fields) ||
    [];
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

  if (
    (command === EVENT_ENGINE_FIELD_SET ||
      command === EVENT_ENGINE_FIELD_STORE) &&
    value.engineFieldKey
  ) {
    const engineField = engineFields.find(
      (e) => e.key === value.engineFieldKey
    );
    if (engineField) {
      if (command === EVENT_ENGINE_FIELD_SET) {
        return (
          (engineFieldUpdateEvents[engineField.key] &&
            engineFieldUpdateEvents[engineField.key]?.fields) ||
          []
        );
      }
      if (command === EVENT_ENGINE_FIELD_STORE) {
        return (
          (engineFieldStoreEvents[engineField.key] &&
            engineFieldStoreEvents[engineField.key]?.fields) ||
          []
        );
      }
    } else {
      return ([] as ScriptEventFieldSchema[]).concat(eventCommands, {
        label: `Unknown field "${value.engineFieldKey}"`,
      });
    }
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
  const scriptEventDefsLookup = useSelector((state: RootState) =>
    selectScriptEventDefsLookup(state)
  );
  const scriptEvent = useSelector((state: RootState) =>
    scriptEventSelectors.selectById(state, id)
  );
  const engineFields = useSelector((state: RootState) => state.engine.fields);
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
        engineFields,
        scriptEventDefsLookup
      );
    }
    return [];
  }, [command, value, customEvents, engineFields, scriptEventDefsLookup]);

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
