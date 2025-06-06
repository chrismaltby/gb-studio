import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useAppSelector } from "store/hooks";
import { Select, Option, OptGroup } from "ui/form/Select";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { useGroupedEngineFields } from "components/settings/useGroupedEngineFields";
import { EngineFieldSchema } from "store/features/engine/engineState";
import { SingleValue } from "react-select";

interface EngineFieldSelectProps {
  name: string;
  value?: string;
  onChange?: (newValue: string) => void;
}

const notDefine = (engineField: EngineFieldSchema) =>
  engineField.cType !== "define";

const EngineFieldSelect: React.FC<EngineFieldSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const groupedFields = useGroupedEngineFields();
  const engineFields = useAppSelector((state) => state.engine.fields);
  const [options, setOptions] = useState<OptGroup[]>([]);

  useEffect(() => {
    setOptions(
      groupedFields.map((g) => ({
        label: l10n(g.name as L10NKey),
        options: g.fields.filter(notDefine).map((f) => ({
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
  };

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(e: SingleValue<Option>) => {
        if (e && onChange) {
          onChange(e.value);
        }
      }}
    />
  );
};

EngineFieldSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default EngineFieldSelect;
