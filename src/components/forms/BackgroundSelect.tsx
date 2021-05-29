import React, { FC, useState, useEffect } from "react";
import uniq from "lodash/uniq";
import { useSelector } from "react-redux";
import { assetFilename } from "lib/helpers/gbstudio";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import {
  OptGroup,
  Option,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  Select,
  SelectCommonProps,
} from "ui/form/Select";
import { Background } from "store/features/entities/entitiesTypes";
import { RootState } from "store/configureStore";
import styled from "styled-components";

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
  const backgrounds = useSelector((state: RootState) =>
    backgroundSelectors.selectAll(state)
  );
  const backgroundsLookup = useSelector((state: RootState) =>
    backgroundSelectors.selectEntities(state)
  );
  const background = useSelector((state: RootState) =>
    backgroundSelectors.selectById(state, value || "")
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentBackground, setCurrentBackground] = useState<Background>();
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const plugins = uniq(backgrounds.map((s) => s.plugin || "")).sort();
    const options = plugins.reduce((memo, plugin) => {
      memo.push({
        label: plugin,
        options: backgrounds
          .filter((s) => (plugin ? s.plugin === plugin : !s.plugin))
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
              <Thumbnail
                style={{
                  backgroundImage:
                    backgroundsLookup[option.value] &&
                    `url("file://${assetFilename(
                      projectRoot,
                      "backgrounds",
                      backgroundsLookup[option.value]
                    )}?_v=${backgroundsLookup[option.value]?._v}")`,
                }}
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
              <Thumbnail
                style={{
                  backgroundImage:
                    background &&
                    `url("file://${assetFilename(
                      projectRoot,
                      "backgrounds",
                      background
                    )}?_v=${background._v}")`,
                }}
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
