import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import events, {
  engineFieldUpdateEvents,
  engineFieldStoreEvents,
} from "lib/events";
import ScriptEventFormField from "./ScriptEventFormField";
import {
  customEventSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import {
  EVENT_ENGINE_FIELD_STORE,
  EVENT_ENGINE_FIELD_SET,
} from "lib/compiler/eventTypes";
import { RootState } from "store/configureStore";
import { Dictionary } from "@reduxjs/toolkit";
import { EngineFieldSchema } from "store/features/engine/engineState";
import {
  CustomEvent,
  ScriptEventFieldSchema,
} from "store/features/entities/entitiesTypes";
import { ScriptEventFields } from "ui/scripting/ScriptEvents";

interface ScriptEventFormProps {
  id: string;
  entityId: string;
  nestLevel: number;
  altBg: boolean;
  renderEvents: (key: string) => React.ReactNode;
}

const genKey = (id: string, key: string, index: number) =>
  `${id}_${key}_${index || 0}`;

const getScriptEventFields = (
  command: string,
  value: { customEventId?: string; engineFieldKey?: string },
  customEvents: Dictionary<CustomEvent>,
  engineFields: EngineFieldSchema[]
) => {
  const eventCommands = (events[command] && events[command]?.fields) || [];
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
        ]
      : [];
    const usedVariables =
      Object.values(customEvent?.variables || []).map((v) => {
        return {
          label: `${v?.name || ""}`,
          defaultValue: "LAST_VARIABLE",
          key: `$variable[${v?.id || ""}]$`,
          type: "variable",
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
  const [fields, setFields] = useState<ScriptEventFieldSchema[]>([]);
  const scriptEvent = useSelector((state: RootState) =>
    scriptEventSelectors.selectById(state, id)
  );
  const engineFields = useSelector((state: RootState) => state.engine.fields);
  const customEvents = useSelector((state: RootState) =>
    customEventSelectors.selectEntities(state)
  );
  const command = scriptEvent?.command;
  const value = scriptEvent?.args;

  useEffect(() => {
    if (command) {
      setFields(
        getScriptEventFields(command, value || {}, customEvents, engineFields)
      );
    }
  }, [command, value, customEvents, engineFields]);

  if (!scriptEvent) {
    return null;
  }

  return (
    <ScriptEventFields>
      {fields.map((field, fieldIndex) => {
        if (field.hide) {
          return null;
        }
        // Determine if field conditions are met and hide if not
        if (field.conditions) {
          const showField = field.conditions.reduce((memo, condition) => {
            const keyValue = value?.[condition.key];
            return (
              memo &&
              (!condition.eq || keyValue === condition.eq) &&
              (!condition.ne || keyValue !== condition.ne) &&
              (!condition.gt || Number(keyValue) > Number(condition.gt)) &&
              (!condition.gte || Number(keyValue) >= Number(condition.gte)) &&
              (!condition.lt || Number(keyValue) > Number(condition.lt)) &&
              (!condition.lte || Number(keyValue) >= Number(condition.lte)) &&
              (!condition.in || condition.in.indexOf(keyValue) >= 0)
            );
          }, true);
          if (!showField) {
            return null;
          }
        }

        if (field.type === "events") {
          return renderEvents(field.key || "");
        }

        return (
          <ScriptEventFormField
            key={genKey(id, field.key || "", fieldIndex)}
            scriptEventId={id}
            field={field}
            entityId={entityId}
            nestLevel={nestLevel}
            altBg={altBg}
          />
        );
      })}
    </ScriptEventFields>
  );
};

export default ScriptEventForm;
