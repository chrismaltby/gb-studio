import React, { memo, useCallback, useMemo } from "react";
import { Select, SelectCommonProps } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";
import { ColorCorrectionSetting } from "shared/lib/resources/types";

interface ColorCorrectionSelectProps extends SelectCommonProps {
  name: string;
  value?: ColorCorrectionSetting;
  onChange?: (newId: ColorCorrectionSetting) => void;
}

interface ColorCorrectionOption {
  value: ColorCorrectionSetting;
  label: string;
}

const ColorCorrectionSelectComponent = ({
  value,
  onChange,
}: ColorCorrectionSelectProps) => {
  const colorCorrectionOptions: ColorCorrectionOption[] = useMemo(
    () => [
      {
        value: "default",
        label: l10n("FIELD_ENABLED_DEFAULT"),
      },
      {
        value: "none",
        label: l10n("FIELD_COLOR_CORRECTION_NONE"),
      },
    ],
    [],
  );

  const currentValue = useMemo(
    () => colorCorrectionOptions.find((option) => option.value === value),
    [colorCorrectionOptions, value],
  );

  const onSelectChange = useCallback(
    (newValue: SingleValue<ColorCorrectionOption>) => {
      if (newValue) {
        onChange?.(newValue.value);
      }
    },
    [onChange],
  );

  return (
    <Select
      value={currentValue}
      options={colorCorrectionOptions}
      onChange={onSelectChange}
    />
  );
};

export const ColorCorrectionSelect = memo<ColorCorrectionSelectProps>(
  ColorCorrectionSelectComponent,
);
