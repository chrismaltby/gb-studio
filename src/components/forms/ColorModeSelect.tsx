import React, { memo, useCallback, useMemo } from "react";
import { ColorModeSetting } from "store/features/settings/settingsState";
import {
  Option,
  OptionLabelWithInfo,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

interface ColorModeSelectProps extends SelectCommonProps {
  name: string;
  value?: ColorModeSetting;
  onChange?: (newId: ColorModeSetting) => void;
}

interface ColorModeOption {
  value: ColorModeSetting;
  label: string;
}

const ColorModeSelectComponent = ({
  value,
  onChange,
}: ColorModeSelectProps) => {
  const colorModeOptionsInfo: { [key: string]: string } = useMemo(
    () => ({
      mono: l10n("FIELD_COLOR_MODE_MONO_INFO"),
      mixed: l10n("FIELD_COLOR_MODE_COLOR_MONO_INFO"),
      color: l10n("FIELD_COLOR_MODE_COLOR_ONLY_INFO"),
    }),
    [],
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
    [],
  );

  const currentValue = useMemo(
    () => colorModeOptions.find((option) => option.value === value),
    [colorModeOptions, value],
  );

  const onSelectChange = useCallback(
    (newValue: SingleValue<ColorModeOption>) => {
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

export const ColorModeSelect = memo<ColorModeSelectProps>(
  ColorModeSelectComponent,
);
