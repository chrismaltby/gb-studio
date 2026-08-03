import React, { memo, useContext, useMemo, useState } from "react";
import { SingleValue } from "react-select";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import {
  VariableCreatableSelect,
  VariableRenameButton,
  VariableRenameCompleteButton,
  VariableRenameInput,
  VariableSelectWrapper,
} from "components/forms/VariableSelect";
import {
  customEventSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  groupVariables,
  namedVariablesByContext,
} from "renderer/lib/variables";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import l10n from "shared/lib/lang/l10n";
import type { ScriptDataTableVariable } from "shared/lib/scriptDataTable/types";
import { CheckIcon, PencilIcon } from "ui/icons/Icons";
import {
  findSelectOption,
  Option,
  OptGroup,
  SelectCommonProps,
} from "ui/form/Select";

type VariableElementOption = Option & {
  variable: ScriptDataTableVariable;
  variableName: string;
};

interface VariableElementOptionGroup extends OptGroup {
  options: VariableElementOption[];
}

interface VariableElementSelectProps extends SelectCommonProps {
  name: string;
  value: ScriptDataTableVariable;
  entityId: string;
  allowRename?: boolean;
  onChange: (newValue: ScriptDataTableVariable) => void;
}

const optionValue = (variable: ScriptDataTableVariable): string =>
  variable.index
    ? JSON.stringify([variable.value, variable.index.value])
    : variable.value;

const VariableElementSelectComponent = ({
  value,
  onChange,
  entityId,
  allowRename,
  ...selectProps
}: VariableElementSelectProps) => {
  const context = useContext(ScriptEditorContext);
  const dispatch = useAppDispatch();
  const [renameVisible, setRenameVisible] = useState(false);
  const [editValue, setEditValue] = useState("");
  const variableId = value.value;
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state),
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, entityId),
  );
  const variables = useMemo(
    () => namedVariablesByContext(context, variablesLookup, customEvent),
    [context, customEvent, variablesLookup],
  );
  const options = useMemo<VariableElementOptionGroup[]>(
    () =>
      groupVariables(variables).map((group) => ({
        label: group.name,
        options: group.variables.flatMap<VariableElementOption>((variable) => {
          const definition = variablesLookup[variable.id];
          if (definition?.type === "array") {
            return Array.from({ length: definition.size }, (_, index) => {
              const indexedVariable: ScriptDataTableVariable = {
                type: "variable",
                value: variable.id,
                index: { type: "number", value: index },
              };
              return {
                value: optionValue(indexedVariable),
                label: `${variable.name}[${index}]`,
                variable: indexedVariable,
                variableName: `${variable.name}[${index}]`,
              };
            });
          }
          if (
            customEvent?.variables[variable.id]?.passByReference === "array"
          ) {
            return [
              {
                value: variable.id,
                label: variable.displayName,
                variable: {
                  type: "variable",
                  value: variable.id,
                  index: { type: "number", value: 0 },
                },
                variableName: variable.name,
              },
            ];
          }
          return [
            {
              value: variable.id,
              label: variable.displayName,
              variable: { type: "variable", value: variable.id },
              variableName: variable.name,
            },
          ];
        }),
      })),
    [customEvent, variables, variablesLookup],
  );
  const isCustomEventArray =
    customEvent?.variables[variableId]?.passByReference === "array";
  const currentValue = useMemo(
    () =>
      findSelectOption<VariableElementOption>(
        options,
        isCustomEventArray ? value.value : optionValue(value),
      ),
    [isCustomEventArray, options, value],
  );
  const currentVariable = variables.find(({ id }) => id === variableId);
  const valueIsLocal = variableId.startsWith("L");
  const valueIsTemp = variableId.startsWith("T");
  const canRename =
    allowRename && !valueIsTemp && context.entityType !== "customEvent";

  const onRenameFinish = () => {
    if (variableId) {
      dispatch(
        entitiesActions.renameVariable({
          variableId: valueIsLocal ? `${entityId}__${variableId}` : variableId,
          name: editValue,
        }),
      );
    }
    setRenameVisible(false);
  };

  const onCreateVariable = (inputValue: string) => {
    const name = inputValue.trim();
    if (!name) {
      return;
    }
    const action = entitiesActions.addVariable({ name });
    dispatch(action);
    onChange({ type: "variable", value: action.payload.variableId });
  };

  return (
    <VariableSelectWrapper
      onClick={(event) => {
        if (event.altKey && variablesLookup[variableId]) {
          dispatch(editorActions.selectVariable({ variableId }));
        }
      }}
    >
      {renameVisible ? (
        <VariableRenameInput
          value={editValue}
          onChange={(event) => setEditValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onRenameFinish();
            } else if (event.key === "Escape") {
              setRenameVisible(false);
            }
          }}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={onRenameFinish}
          autoFocus
        />
      ) : (
        <VariableCreatableSelect
          value={currentValue}
          options={options}
          onChange={(newValue: SingleValue<Option>) => {
            if (newValue) {
              onChange((newValue as VariableElementOption).variable);
            }
          }}
          onCreateOption={onCreateVariable}
          formatOptionLabel={(option, { context: labelContext }) =>
            labelContext === "value"
              ? `$${(option as VariableElementOption).variableName}`
              : option.label
          }
          {...selectProps}
        />
      )}
      {canRename &&
        (renameVisible ? (
          <VariableRenameCompleteButton
            onClick={onRenameFinish}
            title={l10n("FIELD_RENAME")}
          >
            <CheckIcon />
          </VariableRenameCompleteButton>
        ) : (
          <VariableRenameButton
            onClick={() => {
              setEditValue(currentVariable?.name ?? currentValue?.label ?? "");
              setRenameVisible(true);
            }}
            title={l10n("FIELD_RENAME")}
          >
            <PencilIcon />
          </VariableRenameButton>
        ))}
    </VariableSelectWrapper>
  );
};

export const VariableElementSelect = memo<VariableElementSelectProps>(
  VariableElementSelectComponent,
);
