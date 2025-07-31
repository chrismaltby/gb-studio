import React, { FC, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import uniq from "lodash/uniq";
import { spriteSheetSelectors } from "store/features/entities/entitiesState";
import {
  ActorDirection,
  SpriteSheetNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  Option,
  OptGroup,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  FormatFolderLabel,
} from "ui/form/Select";
import SpriteSheetCanvas from "components/world/SpriteSheetCanvas";
import { SingleValue } from "react-select";
import { SpriteModeSetting } from "shared/lib/resources/types";

interface SpriteSheetSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  direction?: ActorDirection;
  frame?: number;
  onChange?: (newId: string) => void;
  filter?: (spriteSheet: SpriteSheetNormalized) => boolean;
  optional?: boolean;
  optionalLabel?: string;
}

interface SpriteSheetOption extends Option {
  spriteMode?: SpriteModeSetting
}

interface SpriteSheetOptGroup extends OptGroup {
  options: SpriteSheetOption[];
}


const buildOptions = (
  memo: SpriteSheetOptGroup[],
  plugin: string | undefined,
  spriteSheets: SpriteSheetNormalized[],
) => {
  memo.push({
    label: plugin ? plugin : "",
    options: spriteSheets.map((spriteSheet) => {
      return {
        value: spriteSheet.id,
        label: spriteSheet.name,
        spriteMode: spriteSheet.spriteMode,
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
  const spriteSheets = useAppSelector((state) =>
    spriteSheetSelectors.selectAll(state),
  );
  const defaultSpriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode,
  );
  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentSpriteSheet, setCurrentSpriteSheet] =
    useState<SpriteSheetNormalized>();
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const filteredSpriteSheets = spriteSheets.filter(filter || (() => true));
    const plugins = uniq(
      filteredSpriteSheets.map((s) => s.plugin || ""),
    ).sort();
    const options = plugins.reduce(
      (memo, plugin) => {
        buildOptions(
          memo,
          plugin,
          filteredSpriteSheets.filter((s) =>
            plugin ? s.plugin === plugin : !s.plugin,
          ),
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
        : ([] as OptGroup[]),
    );

    setOptions(options);
  }, [spriteSheets, optional, filter, optionalLabel]);

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
  }, [currentSpriteSheet, optional, optionalLabel]);

  const onSelectChange = (newValue: SingleValue<Option>) => {
    if (newValue) {
      onChange?.(newValue.value);
    }
  };

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: SpriteSheetOption) => {
        return (
          <OptionLabelWithPreview
            preview={
              <SpriteSheetCanvas
                spriteSheetId={option.value}
                direction={direction}
                frame={frame}
              />
            }
            info={option.spriteMode !== defaultSpriteMode ? option.spriteMode : ""}
          >
            <FormatFolderLabel label={option.label} />
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={
              <SpriteSheetCanvas
                spriteSheetId={value || ""}
                direction={direction}
                frame={frame}
              />
            }
          >
            <FormatFolderLabel label={currentValue?.label} />
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
