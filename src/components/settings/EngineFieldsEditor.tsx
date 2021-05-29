import React, { FC } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  EngineFieldCType,
  EngineFieldSchema,
} from "store/features/engine/engineState";
import { engineFieldValueSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { Button } from "ui/buttons/Button";
import l10n from "lib/helpers/l10n";
import { SliderField } from "ui/form/SliderField";
import { useGroupedEngineFields } from "./useGroupedEngineFields";
import { CardAnchor, CardButtons, CardHeading } from "ui/cards/Card";
import { SearchableCard } from "ui/cards/SearchableCard";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { EngineFieldValue } from "store/features/entities/entitiesTypes";
import { Input } from "ui/form/Input";
import { Checkbox } from "ui/form/Checkbox";
import clamp from "lib/helpers/clamp";
import { Select } from "ui/form/Select";

const { editEngineFieldValue, removeEngineFieldValue } = entitiesActions;

export interface EngineFieldsEditorProps {
  searchTerm?: string;
}

export interface EngineFieldInputProps {
  field: EngineFieldSchema;
  value: EngineFieldValue["value"];
  onChange: (newValue: EngineFieldValue["value"]) => void;
}

const fieldMin = (
  customMin: number | undefined,
  cType: EngineFieldCType
): number => {
  let min = 0;
  if (cType === "BYTE") {
    min = -128;
  } else if (cType === "WORD") {
    min = -32768;
  }
  if (customMin === undefined) {
    return min;
  } else {
    return Math.max(customMin, min);
  }
};

const fieldMax = (
  customMax: number | undefined,
  cType: EngineFieldCType
): number => {
  let max = 255;
  if (cType === "BYTE") {
    max = 127;
  } else if (cType === "WORD") {
    max = 32767;
  } else if (cType === "UWORD") {
    max = 65535;
  }
  if (customMax === undefined) {
    return max;
  } else {
    return Math.min(customMax, max);
  }
};

export const EngineFieldInput: FC<EngineFieldInputProps> = ({
  field,
  value,
  onChange,
}) => {
  if (field.type === "slider") {
    const theValue = typeof value === "number" ? Number(value) : undefined;
    const min = fieldMin(field.min, field.cType);
    const max = fieldMax(field.max, field.cType);
    return (
      <SliderField
        name={field.key}
        value={theValue}
        onChange={onChange}
        placeholder={
          typeof field.defaultValue === "number"
            ? field.defaultValue
            : undefined
        }
        min={min}
        max={max}
      />
    );
  }
  if (field.type === "number") {
    const theValue = typeof value === "number" ? String(value) : undefined;
    const min = fieldMin(field.min, field.cType);
    const max = fieldMax(field.max, field.cType);
    return (
      <Input
        name={field.key}
        type="number"
        value={theValue}
        onChange={(e) => {
          if (e.currentTarget.value.length === 0) {
            onChange(undefined);
          } else {
            if (Number.isNaN(parseInt(e.currentTarget.value))) {
              onChange(undefined);
            } else {
              onChange(clamp(parseInt(e.currentTarget.value), min, max));
            }
          }
        }}
        placeholder={
          typeof field.defaultValue === "string"
            ? field.defaultValue
            : undefined
        }
        min={min}
        max={max}
      />
    );
  }
  if (field.type === "checkbox") {
    const theValue =
      typeof value === "boolean" ? Boolean(value) : Boolean(field.defaultValue);
    return (
      <Checkbox
        id={field.key}
        name={field.key}
        checked={theValue}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
    );
  }
  if (field.type === "select") {
    const theValue = value !== undefined ? value : field.defaultValue;
    const options = (field.options || []).map(([value, label]) => ({
      value,
      label: l10n(label),
    }));
    const selectedOption = options.find((option) => option.value === theValue);
    return (
      <Select
        id={field.key}
        name={field.key}
        value={selectedOption}
        onChange={(e: { value: string }) => onChange(e.value)}
        options={options}
      />
    );
  }
  return <div>Unknown type {field.type}</div>;
};

const EngineFieldsEditor: FC<EngineFieldsEditorProps> = ({ searchTerm }) => {
  const dispatch = useDispatch();
  const values = useSelector(engineFieldValueSelectors.selectEntities);
  const groupedFields = useGroupedEngineFields();

  const resetToDefault = (fields: EngineFieldSchema[]) => () => {
    fields.forEach((field) => {
      dispatch(
        removeEngineFieldValue({
          engineFieldId: field.key,
        })
      );
    });
  };

  return (
    <>
      {groupedFields.map((group) => (
        <SearchableCard
          key={group.name}
          searchTerm={searchTerm}
          searchMatches={group.searchMatches}
        >
          <CardAnchor id={`settings${group.name}`} />
          <CardHeading>
            {l10n("SETTINGS_ENGINE")}: {l10n(group.name)}
          </CardHeading>
          {group.fields.map((field) => (
            <SearchableSettingRow
              key={field.key}
              searchTerm={searchTerm}
              searchMatches={[l10n(field.label), field.key]}
            >
              <SettingRowLabel htmlFor={field.key} style={{ width: 300 }}>
                {l10n(field.label)}
              </SettingRowLabel>
              <SettingRowInput>
                <EngineFieldInput
                  field={field}
                  value={values[field.key]?.value}
                  onChange={(e) => {
                    dispatch(
                      editEngineFieldValue({
                        engineFieldId: field.key,
                        value: e,
                      })
                    );
                  }}
                />
              </SettingRowInput>
            </SearchableSettingRow>
          ))}
          {!searchTerm && (
            <CardButtons>
              <Button onClick={resetToDefault(group.fields)}>
                {l10n("FIELD_RESTORE_DEFAULT")}
              </Button>
            </CardButtons>
          )}
        </SearchableCard>
      ))}
    </>
  );
};

export default EngineFieldsEditor;
