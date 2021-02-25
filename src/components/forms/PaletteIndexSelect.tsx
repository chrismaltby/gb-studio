import React, { FC } from "react";
import l10n from "../../lib/helpers/l10n";
import { Select } from "../ui/form/Select";

interface PaletteIndexSelectProps {
  name: string;
  value?: number;
  onChange?: (newValue: number) => void;
}

interface PaletteIndexOption {
  value: number;
  label: string;
}

const options: PaletteIndexOption[] = Array.from(Array(8)).map((_, index) => ({
  value: index,
  label: l10n("TOOL_PALETTE_N", { number: index + 1 }),
}));

export const PaletteIndexSelect: FC<PaletteIndexSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: PaletteIndexOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};

PaletteIndexSelect.defaultProps = {
  name: undefined,
  value: 0,
};
