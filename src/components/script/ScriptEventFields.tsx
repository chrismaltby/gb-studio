import React, { useContext } from "react";
import ScriptEventFormField from "./ScriptEventFormField";
import {
  ScriptEventFieldSchema,
  ScriptEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  ScriptEventFields as ScriptEventFieldsWrapper,
  ScriptEventFieldGroupWrapper,
} from "ui/scripting/ScriptEvents";
import { useAppSelector } from "store/hooks";
import {
  sceneSelectors,
  soundSelectors,
} from "store/features/entities/entitiesState";
import { ScriptEditorContext } from "./ScriptEditorContext";
import { isFieldVisible } from "shared/lib/scripts/scriptDefHelpers";

interface ScriptEventFieldsProps {
  scriptEvent: ScriptEventNormalized;
  entityId: string;
  nestLevel: number;
  altBg: boolean;
  renderEvents: (key: string, label: string) => React.ReactNode;
  fields: ScriptEventFieldSchema[];
  value: Record<string, unknown> | undefined;
}

const genKey = (id: string, key: string, index: number) =>
  `${id}_${key}_${index || 0}`;

const ScriptEventFields = ({
  scriptEvent,
  entityId,
  nestLevel,
  altBg,
  renderEvents,
  fields,
  value,
}: ScriptEventFieldsProps) => {
  const context = useContext(ScriptEditorContext);

  const soundsLookup = useAppSelector((state) =>
    soundSelectors.selectEntities(state)
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, context.sceneId)
  );

  return (
    <ScriptEventFieldsWrapper>
      {fields.map((field, fieldIndex) => {
        if (field.hide) {
          return null;
        }
        // Determine if field conditions are met and hide if not
        if (value && !isFieldVisible(field, value)) {
          return null;
        }
        if (field.conditions) {
          const showField = field.conditions.reduce((memo, condition) => {
            const keyValue = value?.[condition.key];
            if (condition.soundType) {
              const sound = soundsLookup[keyValue as string];
              return memo && sound?.type === condition.soundType;
            } else if (condition.parallaxEnabled !== undefined) {
              return memo && !!scene?.parallax === condition.parallaxEnabled;
            }
            return memo;
          }, true);
          if (!showField) {
            return null;
          }
        }

        if (field.type === "events") {
          const events = renderEvents(
            field.key || "",
            typeof field.label === "string" ? field.label : ""
          );
          if (field.allowedContexts) {
            if (!field.allowedContexts.includes(context.type)) {
              const newContextType = field.allowedContexts[0];
              const ctx = {
                ...context,
                type: newContextType,
              };
              return (
                <ScriptEditorContext.Provider
                  value={ctx}
                  key={genKey(scriptEvent.id, field.key || "", fieldIndex)}
                >
                  {events}
                </ScriptEditorContext.Provider>
              );
            }
          }
          return events;
        }

        if (field.type === "group" && field.fields) {
          return (
            <ScriptEventFieldGroupWrapper
              key={genKey(scriptEvent.id, field.key || "", fieldIndex)}
              halfWidth={field.width === "50%"}
              wrapItems={field.wrapItems}
              alignBottom={field.alignBottom}
              style={{
                flexBasis: field.flexBasis,
                flexGrow: field.flexGrow,
                minWidth: field.minWidth,
              }}
            >
              <ScriptEventFields
                scriptEvent={scriptEvent}
                entityId={entityId}
                nestLevel={nestLevel}
                altBg={altBg}
                renderEvents={renderEvents}
                fields={field.fields}
                value={value}
              />
            </ScriptEventFieldGroupWrapper>
          );
        }

        return (
          <ScriptEventFormField
            key={genKey(scriptEvent.id, field.key || "", fieldIndex)}
            scriptEvent={scriptEvent}
            field={field}
            entityId={entityId}
            nestLevel={nestLevel}
            altBg={altBg}
          />
        );
      })}
    </ScriptEventFieldsWrapper>
  );
};

export default ScriptEventFields;
