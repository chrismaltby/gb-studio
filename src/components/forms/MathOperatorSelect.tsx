import React, { FC, useMemo } from "react";
import { components, SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
import { Select, SelectCommonProps } from "ui/form/Select";
import { FlexGrow, FlexRow } from "ui/spacing/Spacing";

interface MathOperatorSelectProps extends SelectCommonProps {
  name: string;
  value?: string | null;
  onChange?: (newValue: string | null) => void;
}

interface MathOperatorOption {
  value: string;
  label: string;
}

export const MathOperatorSelect: FC<MathOperatorSelectProps> = ({
  name,
  value = "+=",
  onChange,
  ...selectProps
}) => {
  const options: MathOperatorOption[] = useMemo(
    () => [
      { value: "+=", label: l10n("FIELD_ADD_VALUE") },
      { value: "-=", label: l10n("FIELD_SUB_VALUE") },
      { value: "*=", label: l10n("FIELD_MUL_VARIABLE") },
      { value: "/=", label: l10n("FIELD_DIV_VARIABLE") },
      { value: "%=", label: l10n("FIELD_MOD_VARIABLE") },
    ],
    [],
  );
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<MathOperatorOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
      formatOptionLabel={(option: MathOperatorOption) => {
        return (
          <FlexRow>
            <FlexGrow>{option.label}</FlexGrow>
            {option.value}
          </FlexRow>
        );
      }}
      components={{
        SingleValue: (props) => (
          <components.SingleValue {...props}>
            {currentValue?.value}
          </components.SingleValue>
        ),
      }}
      {...selectProps}
    />
  );
};
