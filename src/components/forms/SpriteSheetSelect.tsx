import React, { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import uniq from "lodash/uniq";
import { RootState } from "../../store/configureStore";
import { spriteSheetSelectors } from "../../store/features/entities/entitiesState";
import { SpriteSheet } from "../../store/features/entities/entitiesTypes";
import {
  Option,
  OptGroup,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "../ui/form/Select";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import l10n from "../../lib/helpers/l10n";

interface SpriteSheetSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  direction?: string;
  frame?: number;
  onChange?: (newId: string) => void;
  filter?: (spriteSheet: SpriteSheet) => boolean;
  optional?: boolean;
  optionalLabel?: string;
}

const type = (t: string) => (s: SpriteSheet) => s.type === t;

const buildOptions = (
  memo: OptGroup[],
  plugin: string | undefined,
  spriteSheets: SpriteSheet[]
) => {
  memo.push({
    label:
      l10n("FIELD_SPRITE_ANIMATED_ACTORS") + (plugin ? ` - ${plugin}` : ""),
    options: spriteSheets.filter(type("actor_animated")).map((spriteSheet) => {
      return {
        value: spriteSheet.id,
        label: spriteSheet.name,
      };
    }),
  });
  memo.push({
    label: l10n("FIELD_SPRITE_ACTORS") + (plugin ? ` - ${plugin}` : ""),
    options: spriteSheets.filter(type("actor")).map((spriteSheet) => {
      return {
        value: spriteSheet.id,
        label: spriteSheet.name,
      };
    }),
  });
  memo.push({
    label: l10n("FIELD_SPRITES") + (plugin ? ` - ${plugin}` : ""),
    options: spriteSheets
      .filter((s) => s.type !== "actor_animated" && s.type !== "actor")
      .map((spriteSheet) => {
        return {
          value: spriteSheet.id,
          label:
            spriteSheet.name +
            (spriteSheet.numFrames > 1
              ? ` (${spriteSheet.numFrames} ${l10n("FIELD_SPRITE_FRAMES")})`
              : ``),
        };
      }),
  });
};

export const SpriteSheetSelect: FC<SpriteSheetSelectProps> = ({
  value,
  direction,
  frame,
  onChange,
  filter,
  optional,
  optionalLabel,
  ...selectProps
}) => {
  const spriteSheets = useSelector((state: RootState) =>
    spriteSheetSelectors.selectAll(state)
  );
  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentSpriteSheet, setCurrentSpriteSheet] = useState<SpriteSheet>();
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const filteredSpriteSheets = spriteSheets.filter(filter || (() => true));
    const plugins = uniq(
      filteredSpriteSheets.map((s) => s.plugin || "")
    ).sort();
    const options = plugins.reduce(
      (memo, plugin) => {
        buildOptions(
          memo,
          plugin,
          filteredSpriteSheets.filter((s) =>
            plugin ? s.plugin === plugin : !s.plugin
          )
        );
        return memo;
      },
      optional
        ? ([
            {
              label: "",
              options: [{ value: "", label: optionalLabel || "None" }],
            },
          ] as OptGroup[])
        : ([] as OptGroup[])
    );

    setOptions(options);
  }, [spriteSheets, optional]);

  useEffect(() => {
    setCurrentSpriteSheet(spriteSheets.find((v) => v.id === value));
  }, [spriteSheets, value]);

  useEffect(() => {
    if (currentSpriteSheet) {
      setCurrentValue({
        value: currentSpriteSheet.id,
        label: `${currentSpriteSheet.name}`,
      });
    } else if (optional) {
      setCurrentValue({
        value: "",
        label: optionalLabel || "None",
      });
    }
  }, [currentSpriteSheet]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
  };

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: Option) => {
        return (
          <OptionLabelWithPreview
            preview={
              <SpriteSheetCanvas
                spriteSheetId={option.value}
                direction={direction}
                frame={frame}
              />
            }
          >
            {option.label}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={
              <SpriteSheetCanvas
                spriteSheetId={value}
                direction={direction}
                frame={frame}
              />
            }
          >
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
