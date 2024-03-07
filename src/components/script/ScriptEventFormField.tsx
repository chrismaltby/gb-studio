import React, { memo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { scriptEventSelectors } from "store/features/entities/entitiesState";
import { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import entitiesActions from "store/features/entities/entitiesActions";
import { ArrowIcon, MinusIcon, PlusIcon } from "ui/icons/Icons";
import ScriptEventFormInput from "./ScriptEventFormInput";
import { FormField, ToggleableFormField } from "ui/form/FormLayout";
import {
  ScriptEventField,
  ScriptEventBranchHeader,
  ScriptEventHeaderCaret,
} from "ui/scripting/ScriptEvents";
import { FixedSpacer, FlexBreak } from "ui/spacing/Spacing";
import { TabBar } from "ui/tabs/Tabs";
import styled from "styled-components";
import API from "renderer/lib/api";

interface ScriptEventFormFieldProps {
  scriptEventId: string;
  field: ScriptEventFieldSchema;
  nestLevel: number;
  altBg: boolean;
  entityId: string;
}

const genKey = (id: string, key: string, index?: number) =>
  `${id}_${key}_${index || 0}`;

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

  :hover {
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

  :last-child {
    margin-bottom: 0;
  }

  :hover ${MultiInputButton} {
    opacity: 1;
  }
`;

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
                dispatch(
                  entitiesActions.editScriptEvent({
                    scriptEventId,
                    changes: {
                      args: updatedArgs,
                    },
                  })
                );
              }
            });
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

    let label = field.label;
    if (typeof label === "string" && label.replace) {
      label = label.replace(
        /\$\$([^$]*)\$\$/g,
        (match, key) => (args?.[key] || "") as string
      );
    }

    if (field.type === "break") {
      return <FlexBreak />;
    }

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
          {label || ""}
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
          id={genKey(scriptEventId, field.key || "")}
          entityId={entityId}
          type={field.type}
          field={field}
          defaultValue={field.defaultValue}
          value={value}
          args={scriptEvent?.args || {}}
          onChange={onChange}
          onChangeArg={setArgValue}
        />
      );

    if (field.toggleLabel) {
      return (
        <ScriptEventField
          halfWidth={field.width === "50%"}
          style={{ flexBasis: field.flexBasis, flexGrow: field.flexGrow }}
        >
          <ToggleableFormField
            name={genKey(scriptEventId, field.key || "")}
            disabledLabel={field.toggleLabel}
            label={label || ""}
            enabled={!!value}
          >
            {inputField}
          </ToggleableFormField>
        </ScriptEventField>
      );
    }

    return (
      <ScriptEventField
        halfWidth={field.width === "50%"}
        inline={field.inline}
        style={{ flexBasis: field.flexBasis, flexGrow: field.flexGrow }}
      >
        <FormField
          name={genKey(scriptEventId, field.key || "")}
          label={
            label &&
            field.type !== "checkbox" &&
            field.type !== "group" &&
            !field.hideLabel
              ? label
              : ""
          }
          title={field.description}
          alignCheckbox={field.alignCheckbox}
        >
          {inputField}
        </FormField>
      </ScriptEventField>
    );
  }
);

export default ScriptEventFormField;
