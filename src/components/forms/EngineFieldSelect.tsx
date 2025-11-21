import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useAppSelector } from "store/hooks";
import { Select, Option, OptGroup, OptionLabelWithInfo } from "ui/form/Select";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { useGroupedEngineFields } from "components/settings/useGroupedEngineFields";
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

const AlertWrapper = styled.div`
  margin-top: 5px;
`;

const EngineFieldSelect: React.FC<EngineFieldSelectProps> = ({
  name,
  value,
  onChange,
  showUnitsWarning,
}) => {
  const groupedFields = useGroupedEngineFields();
  const engineFields = useAppSelector((state) => state.engine.fields);
  const [options, setOptions] = useState<OptGroup[]>([]);

  useEffect(() => {
    setOptions(
      groupedFields.map((g) => ({
        label: l10n(g.name as L10NKey),
        options: g.fields.filter(notEditable).map((f) => ({
          value: f.key,
          label: l10n(f.label as L10NKey),
        })),
      })),
    );
  }, [groupedFields]);

  const currentField = engineFields.find((f) => f.key === value);

  const currentValue = currentField && {
    value: currentField.key,
    label: l10n(currentField.label as L10NKey),
    group: l10n(currentField.group as L10NKey),
  };

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

EngineFieldSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default EngineFieldSelect;
