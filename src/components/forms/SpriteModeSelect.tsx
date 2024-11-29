import React, { FC, useEffect, useMemo, useState } from "react";
import { SpriteModeSetting } from "store/features/settings/settingsState";
import { OptionLabelWithInfo, Select, SelectCommonProps } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";
import { useAppSelector } from "store/hooks";

interface SpriteModeSelectProps extends SelectCommonProps {
  name: string;
  value?: SpriteModeSetting;
  allowDefault?: boolean;
  onChange?: (newId: SpriteModeSetting | undefined) => void;
}

export interface SpriteModeOption {
  value: SpriteModeSetting | undefined;
  label: string;
}

export const SpriteModeSelect: FC<SpriteModeSelectProps> = ({
  value,
  allowDefault,
  onChange,
}) => {
  const [currentValue, setCurrentValue] =
    useState<SpriteModeOption | undefined>();
  const defaultSpriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode
  );
  const spriteModeOptionsInfo: { [key: string]: string } = useMemo(
    () => ({
      "8x8": l10n("FIELD_SPRITE_MODE_8x8_INFO"),
      "8x16": l10n("FIELD_SPRITE_MODE_8x16_INFO"),
    }),
    []
  );

  const spriteModeOptions: SpriteModeOption[] = useMemo(() => {
    const options = allowDefault
      ? [
          {
            value: undefined,
            label: l10n("FIELD_SPRITE_MODE_PROJECT_DEFAULT", {
              default: spriteModeOptionsInfo[defaultSpriteMode],
            }),
          },
        ]
      : ([] as SpriteModeOption[]);

    return options.concat([
      {
        value: "8x16",
        label: l10n("FIELD_SPRITE_MODE_8x16"),
      },
      {
        value: "8x8",
        label: l10n("FIELD_SPRITE_MODE_8x8"),
      },
    ]);
  }, [allowDefault, defaultSpriteMode, spriteModeOptionsInfo]);

  useEffect(() => {
    const currentSpriteMode = spriteModeOptions.find((e) => e.value === value);
    setCurrentValue(currentSpriteMode);
  }, [spriteModeOptions, value]);

  return (
    <Select
      value={currentValue}
      options={spriteModeOptions}
      onChange={(newValue: SingleValue<SpriteModeOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
      formatOptionLabel={(
        option: SpriteModeOption,
        { context }: { context: "menu" | "value" }
      ) => {
        let info = "";
        if (context === "menu") {
          info = option.value ?? spriteModeOptionsInfo[defaultSpriteMode];
        }
        return (
          <OptionLabelWithInfo info={info}>{option.label}</OptionLabelWithInfo>
        );
      }}
    />
  );
};
