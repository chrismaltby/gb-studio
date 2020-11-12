import React, { FC } from "react";
import l10n from "../../lib/helpers/l10n";
import { Select } from "../ui/form/Select";

interface MovementSpeedSelectProps {
  name: string;
  value?: number;
  onChange?: (newValue: number) => void;
}

interface MovementSpeedOption {
  value: number;
  label: string;
}

const options: MovementSpeedOption[] = [
  { value: 0, label: `${l10n("FIELD_SPEED")} ½ (${l10n("FIELD_SLOWER")})` },
  { value: 1, label: `${l10n("FIELD_SPEED")} 1` },
  { value: 2, label: `${l10n("FIELD_SPEED")} 2` },
  { value: 3, label: `${l10n("FIELD_SPEED")} 3` },
  { value: 4, label: `${l10n("FIELD_SPEED")} 4 ${l10n("FIELD_FASTER")}` },
];

export const MovementSpeedSelect: FC<MovementSpeedSelectProps> = ({
  name,
  value = 1,
  onChange,
}) => {
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      id={name}
      value={currentValue}
      options={options}
      onChange={(newValue: MovementSpeedOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};
