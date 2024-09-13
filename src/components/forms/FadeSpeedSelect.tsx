import React, { FC, useMemo } from "react";
import { SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
import { Select } from "ui/form/Select";

interface FadeSpeedSelectProps {
  name: string;
  value?: number | null;
  allowNone?: boolean;
  onChange?: (newValue: number | null) => void;
}

interface FadeSpeedOption {
  value: number;
  label: string;
}

export const FadeSpeedSelect: FC<FadeSpeedSelectProps> = ({
  name,
  value = 2,
  allowNone,
  onChange,
}) => {
  const options: FadeSpeedOption[] = useMemo(
    () => [
      ...(allowNone ? [{ value: 0, label: `${l10n("FIELD_INSTANT")}` }] : []),
      { value: 1, label: `${l10n("FIELD_SPEED")} 1 (${l10n("FIELD_FASTER")})` },
      { value: 2, label: `${l10n("FIELD_SPEED")} 2` },
      { value: 3, label: `${l10n("FIELD_SPEED")} 3` },
      { value: 4, label: `${l10n("FIELD_SPEED")} 4` },
      { value: 5, label: `${l10n("FIELD_SPEED")} 5` },
      { value: 6, label: `${l10n("FIELD_SPEED")} 6 (${l10n("FIELD_SLOWER")})` },
    ],
    [allowNone]
  );

  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<FadeSpeedOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
    />
  );
};
