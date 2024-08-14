import React, { FC, useMemo } from "react";
import l10n from "shared/lib/lang/l10n";
import { CompilerOptimisation } from "shared/lib/resources/types";
import { OptionLabelWithInfo, Select } from "ui/form/Select";

interface CompilerOptimisationSelectProps {
  name: string;
  value?: CompilerOptimisation;
  onChange?: (newValue: CompilerOptimisation) => void;
}

interface CompilerOptimisationOption {
  value: CompilerOptimisation;
  label: string;
  flag: string;
}

export const CompilerOptimisationSelect: FC<CompilerOptimisationSelectProps> =
  ({ name, value, onChange }) => {
    const options: CompilerOptimisationOption[] = useMemo(
      () => [
        {
          value: "none", //
          label: l10n("FIELD_NONE"),
          flag: "",
        },
        {
          value: "speed", //
          label: l10n("FIELD_SPEED"),
          flag: "--opt-code-speed",
        },
        {
          value: "size", //
          label: l10n("FIELD_SIZE"),
          flag: "--opt-code-size",
        },
      ],
      []
    );

    const currentValue = options.find((o) => o.value === value);
    return (
      <Select
        name={name}
        value={currentValue}
        options={options}
        onChange={(newValue: CompilerOptimisationOption) => {
          onChange?.(newValue.value);
        }}
        formatOptionLabel={(option: CompilerOptimisationOption) => {
          return (
            <OptionLabelWithInfo info={option.flag}>
              {option.label}
            </OptionLabelWithInfo>
          );
        }}
      />
    );
  };

CompilerOptimisationSelect.defaultProps = {
  name: undefined,
  value: "none",
};
