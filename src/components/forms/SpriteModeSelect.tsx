import React, { memo, useMemo } from "react";
import { SpriteModeSetting } from "store/features/settings/settingsState";
import { Select, SelectCommonProps } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

interface SpriteModeSelectProps extends SelectCommonProps {
  name: string;
  value?: SpriteModeSetting;
  allowDefault?: boolean;
  onChange?: (newId: SpriteModeSetting | undefined) => void;
}

interface SpriteModeOption {
  value: SpriteModeSetting | undefined;
  label: string;
}

const SpriteModeSelectComponent = ({
  value,
  allowDefault,
  onChange,
}: SpriteModeSelectProps) => {
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

  const currentValue = useMemo(
    () => spriteModeOptions.find((option) => option.value === value),
    [spriteModeOptions, value],
  );

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

export const SpriteModeSelect = memo<SpriteModeSelectProps>(
  SpriteModeSelectComponent,
);
