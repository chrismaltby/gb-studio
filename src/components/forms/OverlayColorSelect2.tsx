import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { Select } from "ui/form/Select";

interface OverlayColorSelectProps {
  name: string;
  value?: string | null;
  allowNone?: boolean;
  onChange?: (newValue: string) => void;
}

interface OverlayColorOption {
  value: string;
  label: string;
}

const options: OverlayColorOption[] = [
  { value: "black", label: `${l10n("FIELD_BLACK")}` },
  { value: "white", label: `${l10n("FIELD_WHITE")}` },
];

export const OverlayColorSelect: FC<OverlayColorSelectProps> = ({
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
      onChange={(newValue: OverlayColorOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};

OverlayColorSelect.defaultProps = {
  name: undefined,
  value: "black",
};
