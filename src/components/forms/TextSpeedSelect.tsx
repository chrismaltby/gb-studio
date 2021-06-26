import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { Select, SelectCommonProps } from "ui/form/Select";

interface TextSpeedSelectProps extends SelectCommonProps {
  name: string;
  value?: number | null;
  onChange?: (newValue: number | null) => void;
}

interface TextSpeedOption {
  value: number;
  label: string;
}

const options: TextSpeedOption[] = [
  { value: 0, label: `${l10n("FIELD_INSTANT")}` },
  { value: 1, label: `${l10n("FIELD_SPEED")} 1` },
  { value: 2, label: `${l10n("FIELD_SPEED")} 2` },
  { value: 3, label: `${l10n("FIELD_SPEED")} 3` },
  { value: 4, label: `${l10n("FIELD_SPEED")} 4` },
  { value: 5, label: `${l10n("FIELD_SPEED")} 5` },
];

export const TextSpeedSelect: FC<TextSpeedSelectProps> = ({
  name,
  value,
  onChange,
  ...selectProps
}) => {
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: TextSpeedOption) => {
        onChange?.(newValue.value);
      }}
      {...selectProps}
    />
  );
};

TextSpeedSelect.defaultProps = {
  name: undefined,
  value: 3,
};
