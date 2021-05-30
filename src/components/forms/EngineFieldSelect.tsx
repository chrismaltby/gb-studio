import React, { FC, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import { Select, Option, OptGroup } from "../ui/form/Select";
import l10n from "../../lib/helpers/l10n";
import { useGroupedEngineFields } from "../settings/useGroupedEngineFields";

interface EngineFieldSelectProps {
  value?: string;
  onChange?: (newValue: string) => void;
}

const EngineFieldSelect: React.FC<EngineFieldSelectProps> = ({
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
        options: g.fields.map((f) => ({
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
