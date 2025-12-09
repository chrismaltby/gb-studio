import React, { FC, useMemo } from "react";
import {
  EngineFieldCType,
  EngineFieldSchema,
} from "store/features/engine/engineState";
import { engineFieldValueSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { Button } from "ui/buttons/Button";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { SliderField } from "ui/form/SliderField";
import { useGroupedEngineFields } from "./useGroupedEngineFields";
import { CardAnchor, CardButtons, CardHeading } from "ui/cards/Card";
import { SearchableCard } from "ui/cards/SearchableCard";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import {
  SettingRowInput,
  SettingRowLabel,
  SettingRowUnits,
  SettingsSidebarContainer,
} from "ui/form/SettingRow";
import { EngineFieldValue } from "shared/lib/entities/entitiesTypes";
import { Input } from "ui/form/Input";
import { Checkbox } from "ui/form/Checkbox";
import clamp from "shared/lib/helpers/clamp";
import { Select } from "ui/form/Select";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SingleValue } from "react-select";
import { isEngineFieldVisible } from "shared/lib/engineFields/engineFieldVisible";
import { FlexRow } from "ui/spacing/Spacing";
import { useEngineFieldsDefaultValues } from "./useEngineFieldsDefaultValues";
import ToggleButtons from "ui/form/ToggleButtons";
import { pxToSubpx, pxToSubpxVelPrecise } from "shared/lib/helpers/subpixels";
import AnimationStateSelect from "components/forms/AnimationStateSelect";

const { editEngineFieldValue, removeEngineFieldValue } = entitiesActions;

interface EngineFieldsEditorProps {
  searchTerm?: string;
  sceneType?: string;
}

interface EngineFieldRowProps {
  field: EngineFieldSchema;
  values: Record<string, EngineFieldValue>;
  defaultValues: Record<string, number | string | boolean | undefined>;
  searchTerm?: string;
}

interface EngineFieldInputProps {
  field: EngineFieldSchema;
  value: EngineFieldValue["value"];
  onChange: (newValue: EngineFieldValue["value"]) => void;
}

const fieldMin = (
  customMin: number | undefined,
  cType: EngineFieldCType,
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
  cType: EngineFieldCType,
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

const roundTo = (x: number, decimalPlaces: number): number => {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(x * factor) / factor;
};

const toFieldUnits = (value: number, field: EngineFieldSchema): number => {
  if (value === undefined) {
    return value;
  }
  if (
    field.editUnits === "subpx" ||
    field.editUnits === "subpxVel" ||
    field.editUnits === "subpxAcc"
  ) {
    return roundTo(value / pxToSubpx(1), 2);
  }
  if (
    field.editUnits === "subpxVelPrecise" ||
    field.editUnits === "subpxAccPrecise"
  ) {
    return roundTo(value / pxToSubpxVelPrecise(1), 2);
  }
  return roundTo(value, 2);
};

const fromFieldUnits = (
  value: number | undefined,
  field: EngineFieldSchema,
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (
    field.editUnits === "subpx" ||
    field.editUnits === "subpxVel" ||
    field.editUnits === "subpxAcc"
  ) {
    return pxToSubpx(value);
  }
  if (
    field.editUnits === "subpxVelPrecise" ||
    field.editUnits === "subpxAccPrecise"
  ) {
    return pxToSubpxVelPrecise(value);
  }
  return Math.floor(value);
};

const EngineFieldUnits = ({ field }: { field: EngineFieldSchema }) => {
  if (!field.editUnits) {
    return <SettingRowUnits />;
  }
  return (
    <SettingRowUnits>
      {(field.editUnits === "subpx" || field.editUnits === "px") &&
        l10n("FIELD_PIXELS_SHORT")}
      {(field.editUnits === "subpxVel" ||
        field.editUnits === "subpxVelPrecise") &&
        l10n("FIELD_PIXELS_PER_FRAME_SHORT")}
      {(field.editUnits === "subpxAcc" ||
        field.editUnits === "subpxAccPrecise") &&
        `${l10n("FIELD_PIXELS_PER_FRAME_SHORT")}²`}
    </SettingRowUnits>
  );
};

const EngineFieldInput: FC<EngineFieldInputProps> = ({
  field,
  value,
  onChange,
}) => {
  if (field.type === "slider") {
    const theValue =
      typeof value === "number"
        ? roundTo(toFieldUnits(Number(value), field), 2)
        : undefined;
    const min = toFieldUnits(fieldMin(field.min, field.cType), field);
    const max = toFieldUnits(fieldMax(field.max, field.cType), field);

    return (
      <SliderField
        name={field.key}
        value={theValue}
        onChange={(e) => {
          onChange(fromFieldUnits(e, field));
        }}
        placeholder={
          typeof field.defaultValue === "number"
            ? toFieldUnits(field.defaultValue, field)
            : undefined
        }
        min={min}
        max={max}
        step={Math.max(0.01, toFieldUnits(1, field))}
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
              onChange(
                fromFieldUnits(
                  clamp(parseInt(e.currentTarget.value), min, max),
                  field,
                ),
              );
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
    const theValue = value !== undefined ? value : field.defaultValue;
    return (
      <Checkbox
        id={field.key}
        name={field.key}
        checked={theValue === 1 ? true : false}
        onChange={(e) => onChange(e.currentTarget.checked === true ? 1 : 0)}
      />
    );
  }
  if (field.type === "select") {
    const theValue = value !== undefined ? value : field.defaultValue;
    const options = (field.options || []).map(([value, label]) => ({
      value,
      label: l10n(label as L10NKey),
    }));
    const selectedOption = options.find((option) => option.value === theValue);
    return (
      <Select
        id={field.key}
        name={field.key}
        value={selectedOption}
        onChange={(e: SingleValue<{ value: number }>) => {
          if (e) {
            onChange(e.value);
          }
        }}
        options={options}
      />
    );
  }
  if (field.type === "togglebuttons") {
    const theValue = value !== undefined ? value : field.defaultValue;
    const options = (field.options || []).map(
      ([value, label]) => [value, l10n(label as L10NKey)] as [number, string],
    );
    return (
      <ToggleButtons
        name={field.key}
        value={theValue as number}
        onChange={(e: number) => {
          if (e) {
            onChange(e);
          }
        }}
        options={options}
        allowMultiple={false}
      />
    );
  }
  if (field.type === "mask") {
    const theValue = value !== undefined ? value : field.defaultValue;
    const options = (field.options || []).map(
      ([value, label]) => [value, l10n(label as L10NKey)] as [number, string],
    );

    const values = options
      .filter(([bit]) => {
        const absBit = Math.abs(bit);
        const isSet = ((theValue as number) & absBit) !== 0;
        return bit < 0 ? !isSet : isSet;
      })
      .map(([bit]) => bit);

    return (
      <ToggleButtons
        name={field.key}
        value={values}
        onChange={(e: number[]) => {
          let result = 0;
          for (const [bit] of options) {
            const absBit = Math.abs(bit);
            const isSelected = e.includes(bit);
            if (bit >= 0) {
              if (isSelected) result |= absBit;
            } else {
              // Negative option values invert the bit
              if (!isSelected) result |= absBit;
            }
          }
          onChange(result);
        }}
        options={options}
        allowMultiple
        allowNone
      />
    );
  }
  if (field.type === "animationstate") {
    return (
      <AnimationStateSelect
        name={field.key}
        value={String(value || "")}
        onChange={onChange}
        allowDefault
      />
    );
  }
  if (field.type === "label") {
    return <></>;
  }
  return <div>Unknown type {field.type}</div>;
};

const EngineFieldRow = ({
  field,
  values,
  defaultValues,
  searchTerm,
}: EngineFieldRowProps) => {
  const dispatch = useAppDispatch();
  const visible = useMemo(() => {
    return isEngineFieldVisible(field, values, defaultValues);
  }, [field, values, defaultValues]);
  if (!visible) {
    return <></>;
  }
  return (
    <SearchableSettingRow
      key={field.key}
      searchTerm={searchTerm}
      searchMatches={[l10n(field.label as L10NKey), field.key]}
      title={field.description && l10n(field.description as L10NKey)}
      indent={field.indent}
      isCheckbox={field.type === "checkbox"}
    >
      <SettingRowLabel htmlFor={field.key} $sectionHeading={field.isHeading}>
        {l10n(field.label as L10NKey)}
      </SettingRowLabel>
      {field.type !== "label" && (
        <SettingRowInput>
          <FlexRow>
            <EngineFieldInput
              field={field}
              value={values[field.key]?.value}
              onChange={(e) => {
                dispatch(
                  editEngineFieldValue({
                    engineFieldId: field.key,
                    value: e,
                  }),
                );
              }}
            />
            {(field.editUnits || field.type === "slider") && (
              <EngineFieldUnits field={field} />
            )}
          </FlexRow>
        </SettingRowInput>
      )}
    </SearchableSettingRow>
  );
};

const EngineFieldsEditor: FC<EngineFieldsEditorProps> = ({
  searchTerm,
  sceneType,
}) => {
  const dispatch = useAppDispatch();
  const values = useAppSelector(engineFieldValueSelectors.selectEntities);
  const groupedFields = useGroupedEngineFields(sceneType);
  const defaultValues = useEngineFieldsDefaultValues();

  const resetToDefault = (fields: EngineFieldSchema[]) => () => {
    fields.forEach((field) => {
      dispatch(
        removeEngineFieldValue({
          engineFieldId: field.key,
        }),
      );
    });
  };

  if (sceneType) {
    return groupedFields.map((group) => {
      if (group.sceneType !== sceneType) {
        return null;
      }
      return (
        <SettingsSidebarContainer key={group.name}>
          {group.fields
            .filter((field) => !field.runtimeOnly)
            .map((field) => (
              <EngineFieldRow
                key={field.key}
                field={field}
                values={values}
                defaultValues={defaultValues}
                searchTerm={searchTerm}
              />
            ))}
        </SettingsSidebarContainer>
      );
    });
  }

  return (
    <>
      {groupedFields.map((group) => (
        <SearchableCard
          key={group.name}
          searchTerm={searchTerm}
          searchMatches={group.searchMatches}
          indent={group.sceneType ? 1 : 0}
        >
          {!sceneType && (
            <>
              <CardAnchor id={`settings${group.name}`} />
              <CardAnchor id={`settings${group.sceneType}`} />
              <CardHeading>{l10n(group.name as L10NKey)}</CardHeading>
            </>
          )}
          {group.fields
            .filter((field) => !field.runtimeOnly)
            .map((field, index) => (
              <EngineFieldRow
                key={field.key || String(index)}
                field={field}
                values={values}
                defaultValues={defaultValues}
                searchTerm={searchTerm}
              />
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
