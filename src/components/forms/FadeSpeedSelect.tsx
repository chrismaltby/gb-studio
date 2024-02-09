import React, { FC, useMemo } from "react";
import l10n from "renderer/lib/l10n";
import { Select } from "ui/form/Select";

interface FadeSpeedSelectProps {
  name: string;
  value?: number | null;
  onChange?: (newValue: number | null) => void;
}

interface FadeSpeedOption {
  value: number;
  label: string;
}

export const FadeSpeedSelect: FC<FadeSpeedSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const options: FadeSpeedOption[] = useMemo(
    () => [
      { value: 1, label: `${l10n("FIELD_SPEED")} 1 (${l10n("FIELD_FASTER")})` },
      { value: 2, label: `${l10n("FIELD_SPEED")} 2` },
      { value: 3, label: `${l10n("FIELD_SPEED")} 3` },
      { value: 4, label: `${l10n("FIELD_SPEED")} 4` },
      { value: 5, label: `${l10n("FIELD_SPEED")} 5` },
      { value: 6, label: `${l10n("FIELD_SPEED")} 6 (${l10n("FIELD_SLOWER")})` },
    ],
    []
  );

  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: FadeSpeedOption) => {
        onChange?.(newValue.value);
      }}
    />
  );
};

FadeSpeedSelect.defaultProps = {
  name: undefined,
  value: 2,
};
