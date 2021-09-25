import React from "react";
import ScriptEventFormField from "./ScriptEventFormField";
import { ScriptEventFieldSchema } from "store/features/entities/entitiesTypes";
import {
  ScriptEventFields as ScriptEventFieldsWrapper,
  ScriptEventFieldGroupWrapper,
} from "ui/scripting/ScriptEvents";

interface ScriptEventFieldsProps {
  id: string;
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
  id,
  entityId,
  nestLevel,
  altBg,
  renderEvents,
  fields,
  value,
}: ScriptEventFieldsProps) => {
  return (
    <ScriptEventFieldsWrapper>
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
          return renderEvents(
            field.key || "",
            typeof field.label === "string" ? field.label : ""
          );
        }

        if (field.type === "group" && field.fields) {
          return (
            <ScriptEventFieldGroupWrapper halfWidth={field.width === "50%"}>
              <ScriptEventFields
                id={id}
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
            key={genKey(id, field.key || "", fieldIndex)}
            scriptEventId={id}
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
