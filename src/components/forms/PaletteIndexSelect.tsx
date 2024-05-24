import React, { FC, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { DMG_PALETTE } from "consts";
import l10n from "shared/lib/lang/l10n";
import {
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import { Palette } from "shared/lib/entities/entitiesTypes";
import PaletteBlock from "components/forms/PaletteBlock";
import {
  OptionLabelWithPreview,
  Select,
  SingleValueWithPreview,
} from "ui/form/Select";
import { paletteName } from "shared/lib/entities/entitiesHelpers";

interface PaletteIndexSelectProps {
  name: string;
  value?: number;
  onChange?: (newValue: number) => void;
}

interface PaletteIndexOption {
  value: number;
  label: string;
  palette?: Palette;
}

export const PaletteIndexSelect: FC<PaletteIndexSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const [options, setOptions] = useState<PaletteIndexOption[]>([]);
  const [currentValue, setCurrentValue] = useState<PaletteIndexOption>();

  const previewAsSceneId = useAppSelector(
    (state) => state.editor.previewAsSceneId
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, previewAsSceneId)
  );
  const palettesLookup = useAppSelector((state) =>
    paletteSelectors.selectEntities(state)
  );
  const defaultSpritePaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultSpritePaletteIds
  );

  useEffect(() => {
    var paletteIndexOptions = Array.from(Array(8)).map((_, index) => ({
      value: index,
      label: l10n("TOOL_PALETTE_N", { number: index + 1 }),
      palette:
        palettesLookup[
          scene
            ? scene.spritePaletteIds?.[index] ||
              defaultSpritePaletteIds[index]
            : defaultSpritePaletteIds[index]
        ],
    }))
    for(let i = 0; i < paletteIndexOptions.length; i++) {
      var palette = paletteIndexOptions[i].palette as Palette;
      if(palette) {
        // @TODO Maybe overkill using deepcopy but couldn't think of a cleaner way to alter the palette name
        let copyPalette = JSON.parse(JSON.stringify(palette));
        copyPalette.name = paletteName(copyPalette, -1);
        paletteIndexOptions[i].palette = copyPalette;
      }
    }
    setOptions(paletteIndexOptions);
  }, [scene, palettesLookup, defaultSpritePaletteIds]);

  useEffect(() => {
    setCurrentValue(options.find((o) => o.value === value));
  }, [value, options]);

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: PaletteIndexOption) => {
        onChange?.(newValue.value);
      }}
      formatOptionLabel={(option: PaletteIndexOption) => {
        return (
          <OptionLabelWithPreview
            preview={
              <PaletteBlock
                type="sprite"
                colors={option.palette?.colors || DMG_PALETTE.colors}
                size={20}
              />
            }
          >
            {option.label}
            {": "}
            {option.palette?.name || l10n("FIELD_PALETTE_DEFAULT_DMG")}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={
              <PaletteBlock
                type="sprite"
                colors={currentValue?.palette?.colors || DMG_PALETTE.colors}
                size={20}
              />
            }
          >
            {currentValue?.label}
            {": "}
            {currentValue?.palette?.name || l10n("FIELD_PALETTE_DEFAULT_DMG")}
          </SingleValueWithPreview>
        ),
      }}
    />
  );
};

PaletteIndexSelect.defaultProps = {
  name: undefined,
  value: 0,
};
