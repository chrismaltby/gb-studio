import React, { FC, useMemo } from "react";
import { SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
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

export const OverlayColorSelect: FC<OverlayColorSelectProps> = ({
  name,
  value = "black",
  onChange,
}) => {
  const options: OverlayColorOption[] = useMemo(
    () => [
      { value: "black", label: `${l10n("FIELD_BLACK")}` },
      { value: "white", label: `${l10n("FIELD_WHITE")}` },
    ],
    [],
  );
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<OverlayColorOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
    />
  );
};
