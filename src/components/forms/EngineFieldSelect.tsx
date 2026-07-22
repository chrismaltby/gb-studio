import React, { memo, useMemo } from "react";
import {
  Select,
  Option,
  OptGroup,
  OptionLabelWithInfo,
  findSelectOption,
} from "ui/form/Select";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { useGroupedEngineFields } from "store/features/engine/hooks/useGroupedEngineFields";
import { EngineFieldSchema } from "store/features/engine/engineState";
import { SingleValue } from "react-select";
import styled from "styled-components";
import { pxToSubpx, pxToSubpxVelPrecise } from "shared/lib/helpers/subpixels";
import { Label } from "ui/form/Label";

interface EngineFieldSelectProps {
  name: string;
  value?: string;
  onChange?: (newValue: string) => void;
  showUnitsWarning?: boolean;
}

const notEditable = (engineField: EngineFieldSchema) =>
  engineField.cType !== "define" && engineField.type !== "label";

interface EngineFieldOption extends Option {
  group?: string;
}

interface EngineFieldOptGroup extends OptGroup {
  options: EngineFieldOption[];
}

const AlertWrapper = styled.div`
  margin-top: 5px;
`;

const EngineFieldSelect = ({
  name,
  value,
  onChange,
  showUnitsWarning,
}: EngineFieldSelectProps) => {
  const groupedFields = useGroupedEngineFields();
  const engineFields = useMemo(() => {
    return groupedFields.flatMap((g) => g.fields);
  }, [groupedFields]);
  const options = useMemo<EngineFieldOptGroup[]>(() => {
    return groupedFields.map((g) => ({
      label: l10n(g.name as L10NKey),
      options: g.fields.filter(notEditable).map((f) => ({
        value: f.key,
        label: l10n(f.label as L10NKey),
        group: l10n(f.group as L10NKey),
      })),
    }));
  }, [groupedFields]);

  const currentField = engineFields.find((f) => f.key === value);

  const currentValue =
    findSelectOption<EngineFieldOption>(options, value) ||
    (currentField && {
      value: currentField.key,
      label: l10n(currentField.label as L10NKey),
      group: l10n(currentField.group as L10NKey),
    });

  return (
    <>
      <Select
        name={name}
        value={currentValue}
        options={options}
        onChange={(e: SingleValue<Option>) => {
          if (e && onChange) {
            onChange(e.value);
          }
        }}
        formatOptionLabel={(
          option: SingleValue<Option>,
          { context }: { context: "menu" | "value" },
        ) => {
          if (option && context === "value") {
            return (
              <OptionLabelWithInfo info={currentValue?.group || ""}>
                {option.label}
              </OptionLabelWithInfo>
            );
          }
          return option?.label;
        }}
      />
      {showUnitsWarning &&
        currentField?.editUnits &&
        currentField.editUnits !== "px" && (
          <AlertWrapper>
            <Label>
              {(currentField.editUnits === "subpx" ||
                currentField.editUnits === "subpxVel" ||
                currentField.editUnits === "subpxAcc") &&
                l10n("WARNING_FIELD_UNITS_SUBPX", { multiplier: pxToSubpx(1) })}
              {(currentField.editUnits === "subpxVelPrecise" ||
                currentField.editUnits === "subpxAccPrecise") &&
                l10n("WARNING_FIELD_UNITS_SUBPX_PRECISE", {
                  multiplier: pxToSubpxVelPrecise(1),
                })}
            </Label>
          </AlertWrapper>
        )}
    </>
  );
};

export default memo(EngineFieldSelect);
