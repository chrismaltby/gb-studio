import React, { FC, useMemo } from "react";
import { SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
import { Select } from "ui/form/Select";
import { OVERLAY_SPEED_DEFAULT, OVERLAY_SPEED_INSTANT } from "consts";

interface OverlaySpeedSelectProps {
  name: string;
  value?: number | null;
  allowNone?: boolean;
  allowDefault?: boolean;
  onChange?: (newValue: number | null) => void;
}

interface OverlaySpeedOption {
  value: number;
  label: string;
}

export const OverlaySpeedSelect: FC<OverlaySpeedSelectProps> = ({
  name,
  value = 2,
  allowNone,
  allowDefault,
  onChange,
}) => {
  const options = useMemo(
    () => [
      ...(allowDefault
        ? [{ value: OVERLAY_SPEED_DEFAULT, label: `${l10n("FIELD_DEFAULT")}` }]
        : []),
      ...(allowNone
        ? [{ value: OVERLAY_SPEED_INSTANT, label: `${l10n("FIELD_INSTANT")}` }]
        : []),
      { value: 0, label: `${l10n("FIELD_SPEED")} 1 (${l10n("FIELD_FASTER")})` },
      { value: 1, label: `${l10n("FIELD_SPEED")} 2` },
      { value: 2, label: `${l10n("FIELD_SPEED")} 3` },
      { value: 3, label: `${l10n("FIELD_SPEED")} 4` },
      { value: 4, label: `${l10n("FIELD_SPEED")} 5` },
      { value: 5, label: `${l10n("FIELD_SPEED")} 6 (${l10n("FIELD_SLOWER")})` },
    ],
    [allowDefault, allowNone],
  );

  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<OverlaySpeedOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
    />
  );
};
