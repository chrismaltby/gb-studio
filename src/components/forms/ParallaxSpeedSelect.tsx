import React, { FC, useEffect, useState } from "react";
import l10n from "../../lib/helpers/l10n";
import { Input } from "../ui/form/Input";
import { OptionLabelWithInfo, Select } from "../ui/form/Select";

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

const options: ParallaxSpeedOption[] = [
  { value: 128, label: `${l10n("FIELD_FIXED_POSITION")}` },
  { value: 0, label: `${l10n("FIELD_SPEED")} 1` },
  { value: 1, label: `${l10n("FIELD_SPEED")} 1/2` },
  { value: 2, label: `${l10n("FIELD_SPEED")} 1/4` },
  { value: 3, label: `${l10n("FIELD_SPEED")} 1/8` },
  { value: 4, label: `${l10n("FIELD_SPEED")} 1/16` },
  { value: 5, label: `${l10n("FIELD_SPEED")} 1/32` },
  { value: 6, label: `${l10n("FIELD_SPEED")} 1/64` },
  { value: 7, label: `${l10n("FIELD_SPEED")} 1/128` },
  { value: 8, label: `${l10n("FIELD_SPEED")} 1/256` },
];

export const ParallaxSpeedSelect: FC<ParallaxSpeedSelectProps> = ({
  name,
  value = 1,
  disabled,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<
    ParallaxSpeedOption | undefined
  >();

  useEffect(() => {
    const current = options.find((o) => o.value === value);
    setCurrentValue(current);
  }, [value]);

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      isDisabled={disabled}
      onChange={(newValue: ParallaxSpeedOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};
