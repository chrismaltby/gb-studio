import React, { FC, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { tilesetSelectors } from "store/features/entities/entitiesState";
import {
  UnitType,
  Tileset,
  GridUnitType,
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
import { TileCanvas } from "components/world/TileCanvas";
import uniq from "lodash/uniq";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";

interface TilesetSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  tileIndex?: number;
  onChange?: (newId: string) => void;
  units?: UnitType;
  optional?: boolean;
  optionalLabel?: string;
  filters?: {
    width?: number;
    height?: number;
  };
}

interface TilesetOption extends Option {
  tileset: Tileset;
}

const Wrapper = styled.div`
  position: relative;
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
  filters,
  ...selectProps
}) => {
  const tilesets = useAppSelector((state) => tilesetSelectors.selectAll(state));
  const [options, setOptions] = useState<OptGroup[]>([]);
  const [currentTileset, setCurrentTileset] = useState<Tileset>();
  const [currentValue, setCurrentValue] = useState<Option>();

  useEffect(() => {
    const filteredTilesets = filters
      ? tilesets.filter((tileset) => {
          if (filters.width && tileset.imageWidth !== filters.width) {
            return false;
          }
          if (filters.height && tileset.imageHeight !== filters.height) {
            return false;
          }
          return true;
        })
      : tilesets;
    const plugins = uniq(filteredTilesets.map((s) => s.plugin || "")).sort();
    const options = plugins.reduce(
      (memo, plugin) => {
        buildOptions(
          memo,
          plugin,
          filteredTilesets.filter((s) =>
            plugin ? s.plugin === plugin : !s.plugin
          )
        );
        return memo;
      },
      optional
        ? ([
            {
              label: "",
              options: [
                { value: "", label: optionalLabel || l10n("FIELD_NONE") },
              ],
            },
          ] as OptGroup[])
        : ([] as OptGroup[])
    );

    setOptions(options);
  }, [tilesets, optional, optionalLabel, filters]);

  useEffect(() => {
    setCurrentTileset(tilesets.find((v) => v.id === value));
  }, [tilesets, value]);

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
          return (
            <OptionLabelWithPreview
              preview={
                option.value ? (
                  <TileCanvas
                    tilesetId={option.value}
                    tileIndex={tileIndex}
                    tileSize={units as GridUnitType}
                  />
                ) : null
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
                value ? (
                  <TileCanvas
                    tilesetId={value}
                    tileIndex={tileIndex}
                    tileSize={units as GridUnitType}
                  />
                ) : null
              }
            >
              <FormatFolderLabel label={currentValue?.label} />
            </SingleValueWithPreview>
          ),
        }}
        {...selectProps}
      />
    </Wrapper>
  );
};
