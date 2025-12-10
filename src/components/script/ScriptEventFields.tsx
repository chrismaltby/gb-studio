import React, { useContext } from "react";
import ScriptEventFormField from "./ScriptEventFormField";
import {
  SceneNormalized,
  ScriptEventFieldSchema,
  ScriptEventNormalized,
  ScriptEventParentType,
} from "shared/lib/entities/entitiesTypes";
import {
  ScriptEventFields as ScriptEventFieldsWrapper,
  ScriptEventFieldGroup,
  ScriptEventBranchHeader,
} from "ui/scripting/ScriptEvents";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  sceneSelectors,
  soundSelectors,
} from "store/features/entities/entitiesState";
import { ScriptEditorContext } from "./ScriptEditorContext";
import entitiesActions from "store/features/entities/entitiesActions";
import { evaluateConditions } from "shared/lib/conditionsFilter";
import { ScriptEditorCtx } from "shared/lib/scripts/context";
import { SoundAsset } from "shared/lib/resources/types";

interface ScriptEventFieldsProps {
  scriptEvent: ScriptEventNormalized;
  entityId: string;
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
  nestLevel: number;
  altBg: boolean;
  renderEvents: (key: string, label: string) => React.ReactNode;
  fields: ScriptEventFieldSchema[];
  value: Record<string, unknown> | undefined;
}

const genKey = (id: string, key: string, index: number) =>
  `${id}_${key}_${index || 0}`;

export const isFieldVisible = (
  field: ScriptEventFieldSchema,
  args: Record<string, unknown>,
  context: ScriptEditorCtx,
  scene: SceneNormalized | undefined,
  soundsLookup: Record<string, SoundAsset>,
  ignoreConditions?: string[],
) => {
  if (!field.conditions) {
    return true;
  }
  return evaluateConditions(
    field.conditions,
    (key) => args[key],
    ignoreConditions,
    (condition) => {
      const keyValue = args?.[condition.key];
      if (condition.soundType) {
        const sound = soundsLookup[keyValue as string];
        return sound?.type === condition.soundType;
      } else if (condition.parallaxEnabled !== undefined) {
        return !!scene?.parallax === condition.parallaxEnabled;
      } else if (condition.sceneType !== undefined) {
        const conditionArray = Array.isArray(condition.sceneType)
          ? condition.sceneType
          : [condition.sceneType];
        return (
          !!scene?.type.toLocaleLowerCase() &&
          conditionArray.includes(scene.type.toLocaleLowerCase())
        );
      } else if (condition.entityType !== undefined) {
        const conditionArray = Array.isArray(condition.entityType)
          ? condition.entityType
          : [condition.entityType];
        return (
          context.entityType && conditionArray.includes(context.entityType)
        );
      } else if (condition.entityTypeNot !== undefined) {
        const conditionArray = Array.isArray(condition.entityTypeNot)
          ? condition.entityTypeNot
          : [condition.entityTypeNot];
        return (
          context.entityType && !conditionArray.includes(context.entityType)
        );
      }
      return true;
    },
  );
};

const ScriptEventFields = ({
  scriptEvent,
  entityId,
  parentId,
  parentKey,
  parentType,
  nestLevel,
  altBg,
  renderEvents,
  fields,
  value,
}: ScriptEventFieldsProps) => {
  const context = useContext(ScriptEditorContext);

  const soundsLookup = useAppSelector((state) =>
    soundSelectors.selectEntities(state),
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, context.sceneId),
  );

  const dispatch = useAppDispatch();

  return (
    <ScriptEventFieldsWrapper>
      {fields.map((field, fieldIndex) => {
        if (field.hide) {
          return null;
        }

        // Determine if field conditions are met and hide if not
        if (
          value &&
          !isFieldVisible(field, value, context, scene, soundsLookup)
        ) {
          return null;
        }

        if (field.type === "events") {
          const events = renderEvents(
            field.key || "",
            typeof field.label === "string" ? field.label : "",
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
            <ScriptEventFieldGroup
              key={genKey(scriptEvent.id, field.key || "", fieldIndex)}
              halfWidth={field.width === "50%"}
              wrapItems={field.wrapItems}
              alignBottom={field.alignBottom}
              flexGrow={field.flexGrow}
              flexBasis={field.flexBasis}
              minWidth={field.minWidth}
            >
              <ScriptEventFields
                scriptEvent={scriptEvent}
                entityId={entityId}
                nestLevel={nestLevel}
                altBg={altBg}
                renderEvents={renderEvents}
                fields={field.fields}
                value={value}
                parentId={parentId}
                parentKey={parentKey}
                parentType={parentType}
              />
            </ScriptEventFieldGroup>
          );
        }

        if (field.type === "collapsable") {
          return (
            <ScriptEventBranchHeader
              key={genKey(scriptEvent.id, field.key || "", fieldIndex)}
              nestLevel={nestLevel}
              isOpen={!value?.[field.key ?? ""]}
              altBg={altBg}
              onToggle={() =>
                dispatch(
                  entitiesActions.editScriptEventArg({
                    scriptEventId: scriptEvent.id,
                    key: field.key ?? "",
                    value: !value?.[field.key ?? ""],
                  }),
                )
              }
              label={field.label}
            >
              {field.fields && (
                <ScriptEventFields
                  scriptEvent={scriptEvent}
                  entityId={entityId}
                  nestLevel={nestLevel}
                  altBg={altBg}
                  renderEvents={renderEvents}
                  fields={field.fields}
                  value={value}
                  parentId={parentId}
                  parentKey={parentKey}
                  parentType={parentType}
                />
              )}
            </ScriptEventBranchHeader>
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
            parentId={parentId}
            parentKey={parentKey}
            parentType={parentType}
          />
        );
      })}
    </ScriptEventFieldsWrapper>
  );
};

export default ScriptEventFields;
