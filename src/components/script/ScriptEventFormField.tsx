import React, { memo, useCallback, useContext } from "react";
import {
  ScriptEventFieldSchema,
  ScriptEventNormalized,
  ScriptEventParentType,
  UnitType,
} from "shared/lib/entities/entitiesTypes";
import entitiesActions from "store/features/entities/entitiesActions";
import { MinusIcon, PlusIcon } from "ui/icons/Icons";
import ScriptEventFormInput from "./ScriptEventFormInput";
import {
  FormField,
  FormFieldProps,
  ToggleableFormField,
} from "ui/form/FormLayout";
import {
  ScriptEventField,
  ScriptEventBranchHeader,
} from "ui/scripting/ScriptEvents";
import { FlexBreak } from "ui/spacing/Spacing";
import { TabBar, TabBarVariant } from "ui/tabs/Tabs";
import styled from "styled-components";
import API from "renderer/lib/api";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { UnitSelectLabelButton } from "components/forms/UnitsSelectLabelButton";
import {
  actorSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { ScriptEditorContext } from "./ScriptEditorContext";
import { ScriptEventUserPresets } from "./ScriptEventUserPresets";

interface ScriptEventFormFieldProps {
  scriptEvent: ScriptEventNormalized;
  field: ScriptEventFieldSchema;
  nestLevel: number;
  altBg: boolean;
  entityId: string;
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
}

const genKey = (id: string, key: string, index?: number) =>
  `${id}_${key}_${index || 0}`;

const isScriptEventInitializationData = (
  data: unknown
): data is { id: string; values?: Record<string, unknown> } => {
  return (
    !!data &&
    typeof data === "object" &&
    "id" in data &&
    (!("values" in data) || typeof data.values === "object")
  );
};

// @TODO This MultiInputButton functionality only seems to be used by eventTextDialogue
// and likely should become part of DialogueTextarea
const MultiInputButton = styled.button`
  background: ${(props) => props.theme.colors.button.background};
  color: ${(props) => props.theme.colors.button.text};
  width: 18px;
  height: 18px;
  line-height: 18px;
  margin-left: 4px;
  opacity: 0.4;
  padding: 0;
  border: 0;
  border-radius: 2px;

  svg {
    width: 8px;
    height: 8px;
  }

  &:hover {
    opacity: 1;
  }

  &&&:active {
    opacity: 0.8;
  }
`;

const ButtonRow = styled.div`
  position: absolute;
  right: 4px;
  bottom: 4px;
  display: flex;
`;

const InputRow = styled.div`
  display: block;
  position: relative;
  margin-bottom: 3px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover ${MultiInputButton} {
    opacity: 1;
  }
`;

const ScriptEventFormField = memo(
  ({
    scriptEvent,
    field,
    entityId,
    parentId,
    parentKey,
    parentType,
    nestLevel,
    altBg,
  }: ScriptEventFormFieldProps) => {
    const dispatch = useAppDispatch();

    const context = useContext(ScriptEditorContext);

    const overrides = useAppSelector((state) => {
      if (context.entityType === "actorPrefab" && context.instanceId) {
        const instance = actorSelectors.selectById(state, context.instanceId);
        return instance?.prefabScriptOverrides?.[scriptEvent.id];
      } else if (context.entityType === "triggerPrefab" && context.instanceId) {
        const instance = triggerSelectors.selectById(state, context.instanceId);
        return instance?.prefabScriptOverrides?.[scriptEvent.id];
      }
    });

    const args = scriptEvent?.args;
    const value: unknown = field.multiple
      ? ([] as unknown[]).concat([], args?.[field.key || ""])
      : args?.[field.key || ""];

    const setArgsValues = useCallback(
      (newArgs: Record<string, unknown>) => {
        if (context.entityType === "actorPrefab" && context.instanceId) {
          dispatch(
            entitiesActions.editActorPrefabScriptEventOverride({
              actorId: context.instanceId,
              scriptEventId: scriptEvent.id,
              args: newArgs,
            })
          );
        } else if (
          context.entityType === "triggerPrefab" &&
          context.instanceId
        ) {
          dispatch(
            entitiesActions.editTriggerPrefabScriptEventOverride({
              triggerId: context.instanceId,
              scriptEventId: scriptEvent.id,
              args: newArgs,
            })
          );
        } else {
          dispatch(
            entitiesActions.editScriptEvent({
              scriptEventId: scriptEvent.id,
              changes: {
                args: newArgs,
              },
            })
          );
        }
      },
      [context.entityType, context.instanceId, dispatch, scriptEvent]
    );

    const setArgValue = useCallback(
      (key: string, value: unknown) => {
        if (context.entityType === "actorPrefab" && context.instanceId) {
          dispatch(
            entitiesActions.editActorPrefabScriptEventOverride({
              actorId: context.instanceId,
              scriptEventId: scriptEvent.id,
              args: {
                [key]: value,
              },
            })
          );
        } else if (
          context.entityType === "triggerPrefab" &&
          context.instanceId
        ) {
          dispatch(
            entitiesActions.editTriggerPrefabScriptEventOverride({
              triggerId: context.instanceId,
              scriptEventId: scriptEvent.id,
              args: {
                [key]: value,
              },
            })
          );
        } else {
          dispatch(
            entitiesActions.editScriptEventArg({
              scriptEventId: scriptEvent.id,
              key,
              value,
            })
          );
        }
        if (scriptEvent && field.key && field.hasPostUpdateFn) {
          API.script
            .scriptEventPostUpdateFn(
              scriptEvent.command,
              field.key,
              { ...scriptEvent.args, [key]: value },
              scriptEvent.args || {}
            )
            .then((updatedArgs) => {
              if (updatedArgs) {
                setArgsValues(updatedArgs);
              }
            });
        }
      },
      [
        context.entityType,
        context.instanceId,
        dispatch,
        field.hasPostUpdateFn,
        field.key,
        scriptEvent,
        setArgsValues,
      ]
    );

    const onChange = useCallback(
      (newValue: unknown, valueIndex?: number) => {
        const key = field.key || "";

        if (Array.isArray(value) && valueIndex !== undefined) {
          return setArgValue(
            key,
            value.map((v, i) => {
              if (i !== valueIndex) {
                return v;
              }
              return newValue;
            })
          );
        }
        return setArgValue(key, newValue);
      },
      [field.key, setArgValue, value]
    );

    const onAddValue = useCallback(
      (valueIndex: number) => {
        const key = field.key || "";
        if (Array.isArray(value)) {
          setArgValue(
            key,
            ([] as unknown[]).concat(
              [],
              value.slice(0, valueIndex + 1),
              field.defaultValue,
              value.slice(valueIndex + 1)
            )
          );
        }
      },
      [field.defaultValue, field.key, setArgValue, value]
    );

    const onRemoveValue = useCallback(
      (valueIndex: number) => {
        const key = field.key || "";
        if (Array.isArray(value)) {
          setArgValue(
            key,
            value.filter((_v, i) => i !== valueIndex)
          );
        }
      },
      [field.key, setArgValue, value]
    );

    const onInsertEventAfter = useCallback(() => {
      const eventData = field.defaultValue;
      if (!isScriptEventInitializationData(eventData)) {
        return;
      }
      dispatch(
        entitiesActions.addScriptEvents({
          entityId: parentId,
          type: parentType,
          key: parentKey,
          insertId: scriptEvent.id,
          data: [
            {
              command: eventData.id,
              args: eventData.values,
            },
          ],
        })
      );
    }, [
      dispatch,
      field.defaultValue,
      parentId,
      parentKey,
      parentType,
      scriptEvent.id,
    ]);

    let label = field.label;
    if (typeof label === "string" && label.replace) {
      label = label.replace(
        /\$\$([^$]*)\$\$/g,
        (_match, key) => (args?.[key] ?? "") as string
      );
    }

    const { unitsField, unitsAllowed } = field;
    const labelWithUnits = unitsField ? (
      <>
        {label}
        <UnitSelectLabelButton
          value={
            (args?.[field.unitsField || ""] || field.unitsDefault) as UnitType
          }
          allowedValues={unitsAllowed}
          onChange={(value) => {
            setArgValue(unitsField, value);
          }}
        />
      </>
    ) : (
      label
    );

    if (field.type === "break") {
      return <FlexBreak />;
    }

    if (field.type === "collapsable") {
      return (
        <ScriptEventBranchHeader
          onToggle={() => onChange(!value)}
          nestLevel={nestLevel}
          altBg={altBg}
          isOpen={!value}
        >
          {label || ""}
        </ScriptEventBranchHeader>
      );
    }

    if (field.type === "presets") {
      return (
        <ScriptEventUserPresets
          scriptEvent={scriptEvent}
          onChange={setArgsValues}
        />
      );
    }

    if (field.type === "tabs") {
      return (
        <TabBar
          variant={(field.variant || "scriptEvent") as TabBarVariant}
          value={String(value || Object.keys(field.values || {})[0])}
          values={field.values || {}}
          onChange={onChange}
        />
      );
    }

    const inputField =
      field.multiple && Array.isArray(value) ? (
        value.map((_, valueIndex) => {
          const fieldId = genKey(scriptEvent.id, field.key || "", valueIndex);
          return (
            <InputRow key={fieldId}>
              <ScriptEventFormInput
                id={fieldId}
                entityId={entityId}
                type={field.type}
                field={field}
                index={valueIndex}
                defaultValue={field.defaultValue}
                value={value[valueIndex]}
                args={scriptEvent?.args || {}}
                onChange={onChange}
                onChangeArg={setArgValue}
                onInsertEventAfter={onInsertEventAfter}
              />
              <ButtonRow>
                {valueIndex !== 0 && (
                  <MultiInputButton onClick={() => onRemoveValue(valueIndex)}>
                    <MinusIcon title="-" />
                  </MultiInputButton>
                )}
                <MultiInputButton onClick={() => onAddValue(valueIndex)}>
                  <PlusIcon title="+" />
                </MultiInputButton>
              </ButtonRow>
            </InputRow>
          );
        })
      ) : (
        <ScriptEventFormInput
          id={genKey(scriptEvent.id, field.key || "")}
          entityId={entityId}
          type={field.type}
          field={field}
          defaultValue={field.defaultValue}
          value={value}
          args={scriptEvent?.args || {}}
          onChange={onChange}
          onChangeArg={setArgValue}
          onInsertEventAfter={onInsertEventAfter}
        />
      );

    if (field.toggleLabel) {
      return (
        <ScriptEventField
          $halfWidth={field.width === "50%"}
          style={{
            flexBasis: field.flexBasis,
            flexGrow: field.flexGrow,
            minWidth: field.minWidth,
          }}
        >
          <ToggleableFormField
            name={genKey(scriptEvent.id, field.key || "")}
            disabledLabel={field.toggleLabel}
            label={label || ""}
            enabled={!!value}
            hasOverride={overrides?.args?.[field.key || ""] !== undefined}
          >
            {inputField}
          </ToggleableFormField>
        </ScriptEventField>
      );
    }

    return (
      <ScriptEventField
        $halfWidth={field.width === "50%"}
        $inline={field.inline}
        $alignBottom={field.alignBottom || field.type === "checkbox"}
        style={{
          flexBasis: field.flexBasis,
          flexGrow: field.flexGrow,
          minWidth: field.minWidth,
        }}
      >
        <FormField
          name={genKey(scriptEvent.id, field.key || "")}
          label={
            label &&
            field.type !== "checkbox" &&
            field.type !== "group" &&
            field.type !== "flag" &&
            !field.hideLabel
              ? labelWithUnits
              : ""
          }
          title={field.description}
          variant={field.labelVariant as FormFieldProps["variant"]}
          hasOverride={overrides?.args?.[field.key || ""] !== undefined}
        >
          {inputField}
        </FormField>
      </ScriptEventField>
    );
  }
);

export default ScriptEventFormField;
