import React, { FC } from "react";
import l10n from "../../lib/helpers/l10n";
import { Select } from "../ui/form/Select";

interface AnimationSpeedSelectProps {
  name: string;
  value?: number | null;
  onChange?: (newValue: number | null) => void;
}

interface AnimationSpeedOption {
  value: number | null;
  label: string;
}

const options: AnimationSpeedOption[] = [
  { value: null, label: "None" },
  { value: 0, label: `${l10n("FIELD_SPEED")} 0 (${l10n("FIELD_SLOWER")})` },
  { value: 1, label: `${l10n("FIELD_SPEED")} 1` },
  { value: 2, label: `${l10n("FIELD_SPEED")} 2` },
  { value: 3, label: `${l10n("FIELD_SPEED")} 3` },
  { value: 4, label: `${l10n("FIELD_SPEED")} 4 ${l10n("FIELD_FASTER")}` },
];

export const AnimationSpeedSelect: FC<AnimationSpeedSelectProps> = ({
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
      onChange={(newValue: AnimationSpeedOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};

AnimationSpeedSelect.defaultProps = {
  name: undefined,
  value: 3,
};
