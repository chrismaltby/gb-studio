import React, { memo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { scriptEventSelectors } from "store/features/entities/entitiesState";
import { ScriptEventFieldSchema } from "store/features/entities/entitiesTypes";
import entitiesActions from "store/features/entities/entitiesActions";
import { ArrowIcon } from "ui/icons/Icons";
import ScriptEventFormInput from "./ScriptEventFormInput";
import { FormField, ToggleableFormField } from "ui/form/FormLayout";
import {
  ScriptEventField,
  ScriptEventBranchHeader,
  ScriptEventHeaderCaret,
} from "ui/scripting/ScriptEvents";
import { FixedSpacer } from "ui/spacing/Spacing";
import { TabBar } from "ui/tabs/Tabs";

interface ScriptEventFormFieldProps {
  scriptEventId: string;
  field: ScriptEventFieldSchema;
  nestLevel: number;
  altBg: boolean;
  entityId: string;
}

const genKey = (id: string, key: string, index?: number) =>
  `${id}_${key}_${index || 0}`;

const ScriptEventFormField = memo(
  ({
    scriptEventId,
    field,
    entityId,
    nestLevel,
    altBg,
  }: ScriptEventFormFieldProps) => {
    const dispatch = useDispatch();
    const scriptEvent = useSelector((state: RootState) =>
      scriptEventSelectors.selectById(state, scriptEventId)
    );

    const args = scriptEvent?.args;
    const value: unknown = field.multiple
      ? ([] as unknown[]).concat([], args?.[field.key || ""])
      : args?.[field.key || ""];

    const setArgValue = useCallback(
      (key: string, value: unknown) => {
        dispatch(
          entitiesActions.editScriptEventArg({
            scriptEventId,
            key,
            value,
          })
        );
        if (scriptEvent && field.postUpdate) {
          field.postUpdate(
            { ...scriptEvent.args, [key]: value },
            scriptEvent.args || {}
          );
        }
      },
      [dispatch, field, scriptEvent, scriptEventId]
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

    if (field.type === "collapsable") {
      return (
        <ScriptEventBranchHeader
          conditional={true}
          onClick={() => onChange(!value)}
          nestLevel={nestLevel}
          altBg={altBg}
          open={!value}
        >
          <ScriptEventHeaderCaret open={!value}>
            <ArrowIcon />
          </ScriptEventHeaderCaret>
          <FixedSpacer width={5} />
          {field.label || ""}
        </ScriptEventBranchHeader>
      );
    }

    if (field.type === "tabs") {
      return (
        <TabBar
          variant="scriptEvent"
          value={String(value || Object.keys(field.values || {})[0])}
          values={field.values || {}}
          onChange={onChange}
        />
      );
    }

    const inputField =
      field.multiple && Array.isArray(value) ? (
        value.map((_, valueIndex) => {
          const fieldId = genKey(scriptEventId, field.key || "", valueIndex);
          return (
            <span key={fieldId} className="ScriptEventForm__InputRow">
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
              />
              <div className="ScriptEventForm__BtnRow">
                {valueIndex !== 0 && (
                  <div
                    className="ScriptEventForm__Btn"
                    onClick={() => onRemoveValue(valueIndex)}
                  >
                    -
                  </div>
                )}
                <div
                  className="ScriptEventForm__Btn"
                  onClick={() => onAddValue(valueIndex)}
                >
                  +
                </div>
              </div>
            </span>
          );
        })
      ) : (
        <ScriptEventFormInput
          id={genKey(scriptEventId, field.key || "")}
          entityId={entityId}
          type={field.type}
          field={field}
          defaultValue={field.defaultValue}
          value={value}
          args={scriptEvent?.args || {}}
          onChange={onChange}
        />
      );

    if (field.toggleLabel) {
      return (
        <ScriptEventField halfWidth={field.width === "50%"}>
          <ToggleableFormField
            name={genKey(scriptEventId, field.key || "")}
            disabledLabel={field.toggleLabel}
            label={field.label || ""}
            enabled={!!value}
          >
            {inputField}
          </ToggleableFormField>
        </ScriptEventField>
      );
    }

    return (
      <ScriptEventField halfWidth={field.width === "50%"}>
        <FormField
          name={genKey(scriptEventId, field.key || "")}
          label={
            field.label && field.type !== "checkbox" && field.type !== "group"
              ? field.label
              : ""
          }
          alignCheckbox={field.alignCheckbox}
        >
          {inputField}
        </FormField>
      </ScriptEventField>
    );
  }
);

export default ScriptEventFormField;
