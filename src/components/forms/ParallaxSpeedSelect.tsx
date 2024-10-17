import React, { FC, useEffect, useMemo, useState } from "react";
import { SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
import { Select } from "ui/form/Select";

interface ParallaxSpeedSelectProps {
  name: string;
  value?: number;
  disabled?: boolean;
  onChange?: (newValue: number) => void;
}

interface ParallaxSpeedOption {
  value: number;
  label: string;
}

export const ParallaxSpeedSelect: FC<ParallaxSpeedSelectProps> = ({
  name,
  value = 1,
  disabled,
  onChange,
}) => {
  const options: ParallaxSpeedOption[] = useMemo(
    () => [
      { value: 128, label: `${l10n("FIELD_FIXED_POSITION")}` },
      { value: 0, label: `${l10n("FIELD_SPEED")} 1` },
      { value: 1, label: `${l10n("FIELD_SPEED")} ½` },
      { value: 2, label: `${l10n("FIELD_SPEED")} ¼` },
      { value: 3, label: `${l10n("FIELD_SPEED")} ⅛` },
      { value: 4, label: `${l10n("FIELD_SPEED")} ¹⁄₁₆` },
      { value: 5, label: `${l10n("FIELD_SPEED")} ¹⁄₃₂` },
      { value: 6, label: `${l10n("FIELD_SPEED")} ¹⁄₆₄` },
      { value: 7, label: `${l10n("FIELD_SPEED")} ¹⁄₁₂₈` },
      { value: 8, label: `${l10n("FIELD_SPEED")} ¹⁄₂₅₆` },
    ],
    []
  );

  const [currentValue, setCurrentValue] =
    useState<ParallaxSpeedOption | undefined>();

  useEffect(() => {
    const current = options.find((o) => o.value === value);
    setCurrentValue(current);
  }, [options, value]);

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      isDisabled={disabled}
      onChange={(newValue: SingleValue<ParallaxSpeedOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
    />
  );
};
