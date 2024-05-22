import React, { FC, useMemo } from "react";
import l10n from "shared/lib/lang/l10n";
import { Select, SelectCommonProps } from "ui/form/Select";
import { FlexRow, FlexGrow } from "ui/spacing/Spacing";

interface OperatorSelectProps extends SelectCommonProps {
  name: string;
  value?: string | null;
  onChange?: (newValue: string | null) => void;
}

interface OperatorOption {
  value: string;
  label: string;
}

export const OperatorSelect: FC<OperatorSelectProps> = ({
  name,
  value,
  onChange,
  ...selectProps
}) => {
  const options: OperatorOption[] = useMemo(
    () => [
      { value: "==", label: l10n("FIELD_EQ") },
      { value: "!=", label: l10n("FIELD_NE") },
      { value: "<", label: l10n("FIELD_LT") },
      { value: ">", label: l10n("FIELD_GT") },
      { value: "<=", label: l10n("FIELD_LTE") },
      { value: ">=", label: l10n("FIELD_GTE") },
    ],
    []
  );

  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: OperatorOption) => {
        onChange?.(newValue.value);
      }}
      formatOptionLabel={(option: OperatorOption) => {
        return (
          <FlexRow>
            <FlexGrow>{option.label}</FlexGrow>
            {option.value}
          </FlexRow>
        );
      }}
      components={{
        SingleValue: () => currentValue?.value,
      }}
      {...selectProps}
    />
  );
};

OperatorSelect.defaultProps = {
  name: undefined,
  value: "==",
};
