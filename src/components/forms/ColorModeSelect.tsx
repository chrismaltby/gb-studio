import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ColorModeSetting } from "store/features/settings/settingsState";
import {
  Option,
  OptionLabelWithInfo,
  Select,
  SelectCommonProps,
} from "ui/form/Select";

interface ColorModeSelectProps extends SelectCommonProps {
  name: string;
  value?: ColorModeSetting;
  onChange?: (newId: ColorModeSetting) => void;
}

export interface ColorModeOption {
  value: ColorModeSetting;
  label: string;
}

const colorModeOptions: ColorModeOption[] = [
  {
    value: "mono",
    label: "Monochrome",
  },
  {
    value: "mixed",
    label: "Color + Monochrome",
  },
  {
    value: "color",
    label: "Color Only",
  },
];

export const ColorModeSelect: FC<ColorModeSelectProps> = ({
  value,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<Option>();
  const colorModeOptionsInfo: { [key: string]: string } = useMemo(
    () => ({
      mono: "GB, GB Color, Pocket",
      mixed: "GB, GB Color, Pocket",
      color: "GB Color, Pocket",
    }),
    []
  );

  useEffect(() => {
    const currentColorMode = colorModeOptions.find((e) => e.value === value);
    if (currentColorMode) {
      setCurrentValue(currentColorMode);
    }
  }, [value]);

  const onSelectChange = useCallback(
    (newValue: ColorModeOption) => {
      onChange?.(newValue.value);
    },
    [onChange]
  );

  return (
    <Select
      value={currentValue}
      options={colorModeOptions}
      onChange={onSelectChange}
      formatOptionLabel={(
        option: Option,
        { context }: { context: "menu" | "value" }
      ) => {
        return (
          <OptionLabelWithInfo
            info={context === "menu" ? colorModeOptionsInfo[option.value] : ""}
          >
            {option.label}
          </OptionLabelWithInfo>
        );
      }}
    />
  );
};
