import React, { FC, useMemo } from "react";
import { SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
import { OptionLabelWithInfo, Select } from "ui/form/Select";

interface CompilerPresetSelectProps {
  name: string;
  value?: number;
  onChange?: (newValue: number) => void;
}

interface CompilerPresetOption {
  value: number;
  label: string;
}

export const CompilerPresetSelect: FC<CompilerPresetSelectProps> = ({
  name,
  value = 3000,
  onChange,
}) => {
  const options: CompilerPresetOption[] = useMemo(
    () => [
      { value: 1000, label: l10n("FIELD_FASTER") },
      { value: 3000, label: l10n("FIELD_DEFAULT") },
      { value: 50000, label: l10n("FIELD_SLOWER") },
      { value: 100000, label: l10n("FIELD_PLACEBO") },
    ],
    []
  );

  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<CompilerPresetOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
      formatOptionLabel={(option: CompilerPresetOption) => {
        return (
          <OptionLabelWithInfo info={`--max-allocs-per-node ${option.value}`}>
            {option.label}
          </OptionLabelWithInfo>
        );
      }}
    />
  );
};
