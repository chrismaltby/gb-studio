import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ColorModeSetting } from "store/features/settings/settingsState";
import {
  Option,
  OptionLabelWithInfo,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";

interface ColorModeSelectProps extends SelectCommonProps {
  name: string;
  value?: ColorModeSetting;
  onChange?: (newId: ColorModeSetting) => void;
}

export interface ColorModeOption {
  value: ColorModeSetting;
  label: string;
}

export const ColorModeSelect: FC<ColorModeSelectProps> = ({
  value,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<Option>();
  const colorModeOptionsInfo: { [key: string]: string } = useMemo(
    () => ({
      mono: l10n("FIELD_COLOR_MODE_MONO_INFO"),
      mixed: l10n("FIELD_COLOR_MODE_COLOR_MONO_INFO"),
      color: l10n("FIELD_COLOR_MODE_COLOR_ONLY_INFO"),
    }),
    []
  );

  const colorModeOptions: ColorModeOption[] = useMemo(
    () => [
      {
        value: "mono",
        label: l10n("FIELD_COLOR_MODE_MONO"),
      },
      {
        value: "mixed",
        label: l10n("FIELD_COLOR_MODE_COLOR_MONO"),
      },
      {
        value: "color",
        label: l10n("FIELD_COLOR_MODE_COLOR_ONLY"),
      },
    ],
    []
  );

  useEffect(() => {
    const currentColorMode = colorModeOptions.find((e) => e.value === value);
    if (currentColorMode) {
      setCurrentValue(currentColorMode);
    }
  }, [colorModeOptions, value]);

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
