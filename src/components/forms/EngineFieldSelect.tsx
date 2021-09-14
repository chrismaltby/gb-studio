import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { Select, Option, OptGroup } from "ui/form/Select";
import l10n from "lib/helpers/l10n";
import { useGroupedEngineFields } from "../settings/useGroupedEngineFields";
import { EngineFieldSchema } from "store/features/engine/engineState";

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
  const engineFields = useSelector((state: RootState) => state.engine.fields);
  const [options, setOptions] = useState<OptGroup[]>([]);

  useEffect(() => {
    setOptions(
      groupedFields.map((g) => ({
        label: l10n(g.name),
        options: g.fields.filter(notDefine).map((f) => ({
          value: f.key,
          label: l10n(f.label),
        })),
      }))
    );
  }, [groupedFields]);

  const currentField = engineFields.find((f) => f.key === value);

  const currentValue = currentField && {
    value: currentField.key,
    label: l10n(currentField.label),
  };

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(e: Option) => {
        if (onChange) {
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

EngineFieldSelect.defaultProps = {
  value: undefined,
  onChange: undefined,
};

export default EngineFieldSelect;
