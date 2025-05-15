import React, { FC, useState, useEffect } from "react";
import uniq from "lodash/uniq";
import { useAppSelector } from "store/hooks";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import {
  OptGroup,
  Option,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  Select,
  SelectCommonProps,
  FormatFolderLabel,
} from "ui/form/Select";
import { Background } from "shared/lib/entities/entitiesTypes";
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

export const BackgroundSelect: FC<BackgroundSelectProps> = ({
  value,
  onChange,
  ...selectProps
}) => {
  const backgrounds = useAppSelector((state) =>
    backgroundSelectors.selectAll(state)
  );
  const backgroundsLookup = useAppSelector((state) =>
    backgroundSelectors.selectEntities(state)
  );
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, value || "")
  );
  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentBackground, setCurrentBackground] = useState<Background>();
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const plugins = uniq(backgrounds.map((s) => s.plugin || "")).sort();
    const options = plugins.reduce((memo, plugin) => {
      memo.push({
        label: plugin,
        options: backgrounds
          .filter(
            (s) =>
              !isMonoOverride(s.filename) &&
              (plugin ? s.plugin === plugin : !s.plugin)
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

    setOptions(options);
  }, [backgrounds]);

  useEffect(() => {
    setCurrentBackground(backgrounds.find((v) => v.id === value));
  }, [backgrounds, value]);

  useEffect(() => {
    if (currentBackground) {
      setCurrentValue({
        value: currentBackground.id,
        label: `${currentBackground.name}`,
      });
    }
  }, [currentBackground]);

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
