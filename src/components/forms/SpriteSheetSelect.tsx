import React, { memo, useCallback, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import uniq from "lodash/uniq";
import { spriteSheetSelectors } from "store/features/entities/entitiesSelectors";
import { SpriteSheetNormalized } from "shared/lib/entities/entitiesTypes";
import {
  Option,
  OptGroup,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  FormatFolderLabel,
  findSelectOption,
} from "ui/form/Select";
import SpriteSheetCanvas from "components/rendering/SpriteSheetCanvas";
import { SingleValue } from "react-select";
import { ActorDirection, SpriteModeSetting } from "shared/lib/resources/types";

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
  spriteMode?: SpriteModeSetting;
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

const SpriteSheetSelectComponent = ({
  value,
  direction,
  frame,
  onChange,
  filter,
  optional,
  optionalLabel,
  ...selectProps
}: SpriteSheetSelectProps) => {
  const spriteSheets = useAppSelector((state) =>
    spriteSheetSelectors.selectAll(state),
  );
  const defaultSpriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode,
  );
  const options = useMemo<SpriteSheetOptGroup[]>(() => {
    const filteredSpriteSheets = spriteSheets.filter(filter || (() => true));
    const plugins = uniq(
      filteredSpriteSheets.map((s) => s.plugin || ""),
    ).sort();
    return plugins.reduce<SpriteSheetOptGroup[]>(
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
        ? [
            {
              label: "",
              options: [{ value: "", label: optionalLabel || "None" }],
            },
          ]
        : [],
    );
  }, [spriteSheets, optional, filter, optionalLabel]);

  const currentValue = useMemo(() => {
    const option = findSelectOption<SpriteSheetOption>(
      options,
      value ?? (optional ? "" : undefined),
    );
    if (option) {
      return option;
    }
    const currentSpriteSheet = spriteSheets.find((item) => item.id === value);
    if (currentSpriteSheet) {
      return { value: currentSpriteSheet.id, label: currentSpriteSheet.name };
    }
    return optional ? { value: "", label: optionalLabel || "None" } : undefined;
  }, [options, spriteSheets, value, optional, optionalLabel]);

  const onSelectChange = (newValue: SingleValue<Option>) => {
    if (newValue) {
      onChange?.(newValue.value);
    }
  };

  const formatOptionLabel = useCallback(
    (option: SpriteSheetOption) => (
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
    ),
    [direction, frame, defaultSpriteMode],
  );

  const SingleValue = useCallback(() => {
    return (
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
    );
  }, [value, direction, frame, currentValue]);

  const selectComponents = useMemo(
    () => ({
      SingleValue,
    }),
    [SingleValue],
  );

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={formatOptionLabel}
      components={selectComponents}
      {...selectProps}
    />
  );
};

export const SpriteSheetSelect = memo<SpriteSheetSelectProps>(
  SpriteSheetSelectComponent,
);
