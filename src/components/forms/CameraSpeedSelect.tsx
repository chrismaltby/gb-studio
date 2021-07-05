import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { Select } from "ui/form/Select";

interface CameraSpeedSelectProps {
  name: string;
  value?: number | null;
  allowNone?: boolean;
  onChange?: (newValue: number | null) => void;
}

interface CameraSpeedOption {
  value: number;
  label: string;
}

const optionsWithoutNone: CameraSpeedOption[] = [
  { value: 1, label: `${l10n("FIELD_SPEED")} 1 (${l10n("FIELD_FASTER")})` },
  { value: 2, label: `${l10n("FIELD_SPEED")} 2` },
  { value: 3, label: `${l10n("FIELD_SPEED")} 3` },
  { value: 4, label: `${l10n("FIELD_SPEED")} 4` },
  { value: 5, label: `${l10n("FIELD_SPEED")} 5 (${l10n("FIELD_SLOWER")})` },
];

const optionsWithNone: CameraSpeedOption[] = [
  { value: 0, label: `${l10n("FIELD_INSTANT")}` },
  ...optionsWithoutNone,
];

export const CameraSpeedSelect: FC<CameraSpeedSelectProps> = ({
  name,
  value,
  allowNone,
  onChange,
}) => {
  const options = allowNone ? optionsWithNone : optionsWithoutNone;
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: CameraSpeedOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};

CameraSpeedSelect.defaultProps = {
  name: undefined,
  value: 2,
};
