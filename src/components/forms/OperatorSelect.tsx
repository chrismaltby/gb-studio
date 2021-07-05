import React, { FC } from "react";
import l10n from "lib/helpers/l10n";
import { Select, SelectCommonProps } from "ui/form/Select";

interface OperatorSelectProps extends SelectCommonProps {
  name: string;
  value?: string | null;
  onChange?: (newValue: string | null) => void;
}

interface OperatorOption {
  value: string;
  label: string;
}

const options: OperatorOption[] = [
  { value: "==", label: l10n("FIELD_EQ") },
  { value: "!=", label: l10n("FIELD_NE") },
  { value: "<", label: l10n("FIELD_LT") },
  { value: ">", label: l10n("FIELD_GT") },
  { value: "<=", label: l10n("FIELD_LTE") },
  { value: ">=", label: l10n("FIELD_GTE") },
];

export const OperatorSelect: FC<OperatorSelectProps> = ({
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
      onChange={(newValue: OperatorOption) => {
        onChange?.(newValue.value);
      }}
      {...selectProps}
    />
  );
};

OperatorSelect.defaultProps = {
  name: undefined,
  value: "==",
};
