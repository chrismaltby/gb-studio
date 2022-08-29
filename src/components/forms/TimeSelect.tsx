import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { Select, SelectCommonProps } from "ui/form/Select";

interface TimeSelectProps extends SelectCommonProps {
  name: string;
  value?: string | null;
  onChange?: (newValue: string | null) => void;
}

interface TimeOption {
  value: string;
  label: string;
}

const options: TimeOption[] = [
  { value: ".RTC_DAYS", label: l10n("FIELD_DAYS") },
  { value: ".RTC_HOURS", label: l10n("FIELD_HOURS") },
  { value: ".RTC_MINUTES", label: l10n("FIELD_MINUTES") },
  { value: ".RTC_SECONDS", label: l10n("FIELD_SECONDS") },
];

export const TimeSelect: FC<TimeSelectProps> = ({
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
      onChange={(newValue: TimeOption) => {
        onChange?.(newValue.value);
      }}
      {...selectProps}
    />
  );
};

TimeSelect.defaultProps = {
  name: undefined,
  value: ".RTC_DAYS",
};
