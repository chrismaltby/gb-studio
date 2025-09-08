import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
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

export const ColorCorrectionSelect: FC<ColorCorrectionSelectProps> = ({
  value,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<ColorCorrectionOption>();

  const colorCorrectionOptions: ColorCorrectionOption[] = useMemo(
    () => [
      {
        value: "default",
        label: l10n("FIELD_COLOR_CORRECTION_ENABLED_DEFAULT"),
      },
      {
        value: "none",
        label: l10n("FIELD_COLOR_CORRECTION_NONE"),
      },
    ],
    [],
  );

  useEffect(() => {
    const currentColorCorrection = colorCorrectionOptions.find(
      (e) => e.value === value,
    );
    if (currentColorCorrection) {
      setCurrentValue(currentColorCorrection);
    }
  }, [colorCorrectionOptions, value]);

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
