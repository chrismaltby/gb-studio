import React, { FC, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import { Select, Option } from "../ui/form/Select";
import l10n from "../../lib/helpers/l10n";

interface EngineFieldSelectProps {
  value?: string;
  onChange?: (newValue: string) => void;
}

const EngineFieldSelect: React.FC<EngineFieldSelectProps> = ({
  value,
  onChange,
}) => {
  const engineFields = useSelector((state: RootState) => state.engine.fields);
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    setOptions(
      engineFields.map((f) => ({
        value: f.key,
        label: l10n(f.label),
      }))
    );
  }, [engineFields]);

  const currentValue = options.find((o) => o.value === value);
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
