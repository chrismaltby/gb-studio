import React, { FC, useEffect, useMemo, useState } from "react";
import { SpriteAnimationType } from "shared/lib/entities/entitiesTypes";
import { OptGroup, Option, Select } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

interface AnimationTypeSelectProps {
  name: string;
  value?: SpriteAnimationType;
  onChange?: (newValue: SpriteAnimationType) => void;
}

interface AnimationTypeOption extends Option {
  value: SpriteAnimationType;
}

interface AnimationTypeOptGroup extends OptGroup {
  options: AnimationTypeOption[];
}

export const AnimationTypeSelect: FC<AnimationTypeSelectProps> = ({
  name,
  value = "fixed",
  onChange,
}) => {
  const [currentValue, setCurrentValue] = useState<AnimationTypeOption>();

  const options: AnimationTypeOptGroup[] = useMemo(
    () => [
      {
        label: l10n("FIELD_FIXED_DIRECTION"),
        options: [
          { label: l10n("FIELD_FIXED_DIRECTION"), value: "fixed" },
          {
            label: l10n("FIELD_FIXED_DIRECTION_MOVEMENT"),
            value: "fixed_movement",
          },
        ],
      },
      {
        label: l10n("FIELD_MULTI_DIRECTION"),
        options: [
          { label: l10n("FIELD_MULTI_DIRECTION"), value: "multi" },
          {
            label: l10n("FIELD_MULTI_DIRECTION_MOVEMENT"),
            value: "multi_movement",
          },
        ],
      },
      {
        label: l10n("GAMETYPE_PLATFORMER"),
        options: [
          { label: l10n("FIELD_PLATFORMER_PLAYER"), value: "platform_player" },
        ],
      },
      {
        label: l10n("GAMETYPE_POINT_N_CLICK"),
        options: [{ label: l10n("FIELD_CURSOR"), value: "cursor" }],
      },
    ],
    []
  );

  useEffect(() => {
    if (value) {
      let found = false;
      for (const group of options) {
        for (const option of group.options) {
          if (option.value === value) {
            setCurrentValue(option);
            found = true;
            break;
          }
        }
        if (found) {
          break;
        }
      }
    }
  }, [options, value]);

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<AnimationTypeOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
    />
  );
};
