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
  const [currentValue, setCurrentValue] = useState<
    SpriteModeOption | undefined
  >();

  const spriteModeOptions: SpriteModeOption[] = useMemo(() => {
    const options = allowDefault
      ? [
          {
            value: undefined,
            label: l10n("FIELD_NONE"),
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
  }, [allowDefault]);

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
    />
  );
};
