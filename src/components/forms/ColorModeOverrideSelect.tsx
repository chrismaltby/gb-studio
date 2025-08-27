import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  Option,
  OptionLabelWithInfo,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";
import { ColorModeOverrideSetting } from "shared/lib/resources/types";

interface ColorModeOverrideSelectProps extends SelectCommonProps {
  name: string;
  value?: ColorModeOverrideSetting;
  onChange?: (newId: ColorModeOverrideSetting) => void;
}

interface ColorModeOverrideOption {
  value: ColorModeOverrideSetting;
  label: string;
}

export const ColorModeOverrideSelect: FC<ColorModeOverrideSelectProps> = ({
  value,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<ColorModeOverrideOption>();
  const colorModeOptionsInfo: { [key: string]: string } = useMemo(
    () => ({
      mono: l10n("FIELD_COLOR_MODE_MONO_INFO"),
      mixed: l10n("FIELD_COLOR_MODE_COLOR_MONO_INFO"),
      color: l10n("FIELD_COLOR_MODE_COLOR_ONLY_INFO"),
    }),
    [],
  );

  const colorModeOptions: ColorModeOverrideOption[] = useMemo(
    () => [
      {
        value: "none",
        label: l10n("FIELD_NONE"),
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
    [],
  );

  useEffect(() => {
    const currentColorMode = colorModeOptions.find((e) => e.value === value);
    if (currentColorMode) {
      setCurrentValue(currentColorMode);
    }
  }, [colorModeOptions, value]);

  const onSelectChange = useCallback(
    (newValue: SingleValue<ColorModeOverrideOption>) => {
      if (newValue) {
        onChange?.(newValue.value);
      }
    },
    [onChange],
  );

  return (
    <Select
      value={currentValue}
      options={colorModeOptions}
      onChange={onSelectChange}
      formatOptionLabel={(
        option: Option,
        { context }: { context: "menu" | "value" },
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
