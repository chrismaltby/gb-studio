import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { Select, SelectCommonProps } from "ui/form/Select";

interface DigitSelectProps extends SelectCommonProps {
  name: string;
  value?: number | null;
  onChange?: (newValue: number | null) => void;
}

interface DigitOption {
  value: number;
  label: string;
}

const options: DigitOption[] = [
  { value: 1, label: l10n("FIELD_ONES") },
  { value: 10, label: l10n("FIELD_TENS") },
  { value: 100, label: l10n("FIELD_HUNDREDS") },
  { value: 1000, label: l10n("FIELD_THOUSANDS") },
  { value: 10000, label: l10n("FIELD_TEN_THOUSANDS") },
];

export const DigitSelect: FC<DigitSelectProps> = ({
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
      onChange={(newValue: DigitOption) => {
        onChange?.(newValue.value);
      }}
      {...selectProps}
    />
  );
};

DigitSelect.defaultProps = {
  name: undefined,
  value: 1,
};
