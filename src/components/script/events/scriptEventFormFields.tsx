import React from "react";
import type { ScriptEventDef } from "lib/scriptEventsHandlers/handlerTypes";
import type {
  ScriptEventFieldSchema,
  ScriptNormalized,
} from "shared/lib/entities/entitiesTypes";

export const getScriptEventFields = (
  command: string,
  value: { customEventId?: string; engineFieldKey?: string },
  customEvents: Record<string, ScriptNormalized>,
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
        if (v?.passByReference === "array") {
          return {
            label: `${v.name || ""}[${v.length}]`,
            key: `$variable[${v.id || ""}]$`,
            type: "variable",
            defaultValue: "LAST_VARIABLE",
            variableType: "arrayReference",
            arrayLength: v.length,
          } satisfies ScriptEventFieldSchema;
        }
        return {
          label: `${v?.name || ""}`,
          key: `$variable[${v?.id || ""}]$`,
          type: "value",
          defaultValue: {
            type: "variable",
            value: "LAST_VARIABLE",
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
