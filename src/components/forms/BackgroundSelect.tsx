import React, { memo, useMemo } from "react";
import uniq from "lodash/uniq";
import { useAppSelectorPick, useAppSelectorPickArray } from "store/hooks";
import { backgroundSelectors } from "store/features/entities/entitiesSelectors";
import {
  OptGroup,
  Option,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  Select,
  SelectCommonProps,
  FormatFolderLabel,
  findSelectOption,
} from "ui/form/Select";
import styled from "styled-components";
import { assetURLStyleProp } from "shared/lib/helpers/assets";
import { isMonoOverride } from "shared/lib/assets/backgrounds";
import { SingleValue } from "react-select";

interface BackgroundSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  onChange?: (newId: string) => void;
}

const Thumbnail = styled.div`
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

const BackgroundSelectComponent = ({
  value,
  onChange,
  ...selectProps
}: BackgroundSelectProps) => {
  const backgrounds = useAppSelectorPickArray(backgroundSelectors.selectAll, [
    "id",
    "name",
    "filename",
    "plugin",
  ] as const);
  const background = useAppSelectorPick(
    (state) => backgroundSelectors.selectById(state, value || ""),
    ["id", "filename", "plugin"] as const,
  );
  const backgroundsLookup = useMemo(
    () => Object.fromEntries(backgrounds.map((item) => [item.id, item])),
    [backgrounds],
  );
  const options = useMemo(() => {
    const plugins = uniq(backgrounds.map((s) => s.plugin || "")).sort();
    return plugins.reduce((memo, plugin) => {
      memo.push({
        label: plugin,
        options: backgrounds
          .filter(
            (s) =>
              !isMonoOverride(s.filename) &&
              (plugin ? s.plugin === plugin : !s.plugin),
          )
          .map((background) => {
            return {
              label: background.name,
              value: background.id,
            };
          }),
      });
      return memo;
    }, [] as OptGroup[]);
  }, [backgrounds]);
  const currentValue = useMemo(() => {
    const option = findSelectOption(options, value);
    if (option) {
      return option;
    }
    const currentBackground = backgrounds.find((item) => item.id === value);
    return currentBackground
      ? { value: currentBackground.id, label: currentBackground.name }
      : undefined;
  }, [backgrounds, options, value]);

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
      formatOptionLabel={(option: Option) => {
        const background = backgroundsLookup[option.value];
        return (
          <OptionLabelWithPreview
            preview={
              <Thumbnail
                style={{
                  backgroundImage:
                    background && assetURLStyleProp("backgrounds", background),
                }}
              />
            }
          >
            <FormatFolderLabel label={option.label} />
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={
              <Thumbnail
                style={{
                  backgroundImage:
                    background && assetURLStyleProp("backgrounds", background),
                }}
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

export const BackgroundSelect = memo(BackgroundSelectComponent);
