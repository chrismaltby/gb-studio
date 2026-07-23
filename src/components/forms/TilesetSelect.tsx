import React, { useMemo } from "react";
import { useAppSelectorPickArray } from "store/hooks";
import { tilesetSelectors } from "store/features/entities/entitiesSelectors";
import { UnitType, GridUnitType } from "shared/lib/entities/entitiesTypes";
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
import { TileCanvas } from "components/rendering/TileCanvas";
import uniq from "lodash/uniq";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

type TilesetSummary = {
  id: string;
  name: string;
  plugin?: string;
  imageWidth: number;
  imageHeight: number;
};

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
  tileset?: TilesetSummary;
}

interface TilesetOptGroup extends OptGroup {
  options: TilesetOption[];
}

const buildOptions = (
  memo: TilesetOptGroup[],
  plugin: string | undefined,
  tilesets: TilesetSummary[],
) => {
  memo.push({
    label: plugin ? plugin : "",
    options: tilesets.map((tileset) => ({
      value: tileset.id,
      label: tileset.name,
      tileset,
    })),
  });
};

const TilesetSelectComponent = ({
  value,
  tileIndex,
  onChange,
  units,
  optional,
  optionalLabel,
  filters,
  ...selectProps
}: TilesetSelectProps) => {
  const tilesets = useAppSelectorPickArray(tilesetSelectors.selectAll, [
    "id",
    "name",
    "plugin",
    "imageWidth",
    "imageHeight",
  ] as const);

  const filterWidth = filters?.width;
  const filterHeight = filters?.height;

  const filteredTilesets = useMemo(() => {
    if (filterWidth === undefined && filterHeight === undefined) {
      return tilesets;
    }
    return tilesets.filter((tileset) => {
      if (filterWidth !== undefined && tileset.imageWidth !== filterWidth) {
        return false;
      }
      if (filterHeight !== undefined && tileset.imageHeight !== filterHeight) {
        return false;
      }
      return true;
    });
  }, [tilesets, filterWidth, filterHeight]);

  const options = useMemo(() => {
    const plugins = uniq(filteredTilesets.map((s) => s.plugin || "")).sort();

    return plugins.reduce<TilesetOptGroup[]>(
      (memo, plugin) => {
        buildOptions(
          memo,
          plugin,
          filteredTilesets.filter((s) =>
            plugin ? s.plugin === plugin : !s.plugin,
          ),
        );
        return memo;
      },
      optional
        ? [
            {
              label: "",
              options: [
                {
                  value: "",
                  label: optionalLabel || l10n("FIELD_NONE"),
                },
              ],
            },
          ]
        : [],
    );
  }, [filteredTilesets, optional, optionalLabel]);

  const currentTileset = useMemo(
    () => tilesets.find((tileset) => tileset.id === value),
    [tilesets, value],
  );

  const currentValue = useMemo<TilesetOption | undefined>(() => {
    const option = findSelectOption<TilesetOption>(
      options,
      value ?? (optional ? "" : undefined),
    );
    if (option) {
      return option;
    }
    if (currentTileset) {
      return {
        value: currentTileset.id,
        label: currentTileset.name,
        tileset: currentTileset,
      };
    }

    if (optional) {
      return {
        value: "",
        label: optionalLabel || l10n("FIELD_NONE"),
      };
    }

    return undefined;
  }, [currentTileset, options, optional, optionalLabel, value]);

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
  );
};

export const TilesetSelect = React.memo(TilesetSelectComponent);
