import React, { FC, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import {
  backgroundSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import {
  UnitType,
  Tileset,
  GridUnitType,
  Background,
} from "shared/lib/entities/entitiesTypes";
import {
  Option,
  OptGroup,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "ui/form/Select";
import { TileCanvas } from "components/world/TileCanvas";
import uniq from "lodash/uniq";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";
import { assetURLStyleProp } from "shared/lib/helpers/assets";

interface TilesetSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  tileIndex?: number;
  onChange?: (newId: string) => void;
  units?: UnitType;
  optional?: boolean;
  optionalLabel?: string;
  includeBackgrounds?: boolean;
}

interface TilesetOption extends Option {
  tileset: Tileset;
}

const Wrapper = styled.div`
  position: relative;
`;

const Thumbnail = styled.div`
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

const buildOptions = (
  memo: OptGroup[],
  plugin: string | undefined,
  tilesets: Tileset[]
) => {
  memo.push({
    label: plugin ? plugin : "",
    options: tilesets.map((tileset) => {
      return {
        value: tileset.id,
        label: tileset.name,
      };
    }),
  });
};

export const TilesetSelect: FC<TilesetSelectProps> = ({
  value,
  tileIndex,
  onChange,
  units,
  optional,
  optionalLabel,
  includeBackgrounds,
  ...selectProps
}) => {
  const tilesets = useAppSelector((state) => tilesetSelectors.selectAll(state));
  const backgrounds = useAppSelector((state) =>
    backgroundSelectors.selectAll(state)
  );
  const backgroundsLookup = useAppSelector((state) =>
    backgroundSelectors.selectEntities(state)
  );
  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentTileset, setCurrentTileset] = useState<Tileset | Background>();
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const plugins = uniq(tilesets.map((s) => s.plugin || "")).sort();
    const bgPlugins = includeBackgrounds
      ? uniq(tilesets.map((s) => s.plugin || "")).sort()
      : [];

    const options = [
      ...(optional
        ? [
            {
              label: "",
              options: [
                { value: "", label: optionalLabel || l10n("FIELD_NONE") },
              ],
            },
          ]
        : []),
      ...plugins.reduce((memo, plugin) => {
        buildOptions(
          memo,
          plugin,
          tilesets.filter((s) => (plugin ? s.plugin === plugin : !s.plugin))
        );
        return memo;
      }, [] as OptGroup[]),
      ...(includeBackgrounds
        ? bgPlugins.reduce((memo, plugin) => {
            buildOptions(
              memo,
              plugin || l10n("FIELD_BACKGROUNDS"),
              backgrounds.filter((s) =>
                plugin ? s.plugin === plugin : !s.plugin
              )
            );
            return memo;
          }, [] as OptGroup[])
        : []),
    ];
    setOptions(options);
  }, [tilesets, optional, optionalLabel, includeBackgrounds, backgrounds]);

  useEffect(() => {
    const background = includeBackgrounds
      ? backgrounds.find((v) => v.id === value)
      : undefined;
    const defaultTileset = !optional ? tilesets[0] : undefined;
    const tileset =
      background ?? tilesets.find((v) => v.id === value) ?? defaultTileset;
    setCurrentTileset(tileset);
  }, [backgrounds, includeBackgrounds, optional, tilesets, value]);

  useEffect(() => {
    if (currentTileset) {
      setCurrentValue({
        value: currentTileset.id,
        label: `${currentTileset.name}`,
      });
    } else if (optional) {
      setCurrentValue({
        value: "",
        label: optionalLabel || "None",
      });
    }
  }, [currentTileset, optional, optionalLabel]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
  };

  return (
    <Wrapper>
      <Select
        value={currentValue}
        options={options}
        onChange={onSelectChange}
        formatOptionLabel={(option: TilesetOption) => {
          const background = backgroundsLookup[option.value];
          return (
            <OptionLabelWithPreview
              preview={
                option.value ? (
                  background ? (
                    <Thumbnail
                      style={{
                        backgroundImage:
                          background &&
                          assetURLStyleProp("backgrounds", background),
                      }}
                    />
                  ) : (
                    <TileCanvas
                      tilesetId={option.value}
                      tileIndex={tileIndex}
                      tileSize={units as GridUnitType}
                    />
                  )
                ) : null
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
                value ? (
                  backgroundsLookup[value] ? (
                    <Thumbnail
                      style={{
                        backgroundImage:
                          currentTileset &&
                          assetURLStyleProp("backgrounds", currentTileset),
                      }}
                    />
                  ) : (
                    <TileCanvas
                      tilesetId={value}
                      tileIndex={tileIndex}
                      tileSize={units as GridUnitType}
                    />
                  )
                ) : null
              }
            >
              {currentValue?.label}
            </SingleValueWithPreview>
          ),
        }}
        {...selectProps}
      />
    </Wrapper>
  );
};
