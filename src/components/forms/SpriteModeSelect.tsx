import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { SpriteModeSetting } from "store/features/settings/settingsState";
import { OptionLabelWithInfo, Select, SelectCommonProps } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

interface SpriteModeSelectProps extends SelectCommonProps {
  name: string;
  value?: SpriteModeSetting;
  onChange?: (newId: SpriteModeSetting) => void;
}

export interface SpriteModeOption {
  value: SpriteModeSetting;
  label: string;
}

export const SpriteModeSelect: FC<SpriteModeSelectProps> = ({
  value,
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<SpriteModeOption>();
  const spriteModeOptionsInfo: { [key: string]: string } = useMemo(
    () => ({
      "8x8": l10n("FIELD_SPRITE_MODE_8x8_INFO"),
      "8x16": l10n("FIELD_SPRITE_MODE_8x16_INFO"),
    }),
    []
  );

  const spriteModeOptions: SpriteModeOption[] = useMemo(
    () => [
      {
        value: "8x16",
        label: l10n("FIELD_SPRITE_MODE_8x16"),
      },
      {
        value: "8x8",
        label: l10n("FIELD_SPRITE_MODE_8x8"),
      },
    ],
    []
  );

  useEffect(() => {
    const currentSpriteMode = spriteModeOptions.find((e) => e.value === value);
    if (currentSpriteMode) {
      setCurrentValue(currentSpriteMode);
    }
  }, [spriteModeOptions, value]);

  const onSelectChange = useCallback(
    (newValue: SingleValue<SpriteModeOption>) => {
      if (newValue) {
        onChange?.(newValue.value);
      }
    },
    [onChange]
  );

  return (
    <Select
      value={currentValue}
      options={spriteModeOptions}
      onChange={onSelectChange}
      formatOptionLabel={(
        option: Option,
        { context }: { context: "menu" | "value" }
      ) => {
        return (
          <OptionLabelWithInfo
            info={context === "menu" ? spriteModeOptionsInfo[option.value] : ""}
          >
            {option.label}
          </OptionLabelWithInfo>
        );
      }}
    />
  );
};
