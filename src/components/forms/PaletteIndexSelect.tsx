import React, { FC, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import {
  getLocalisedDMGPalette,
  getLocalisedPalettesLookup,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import { Palette } from "shared/lib/entities/entitiesTypes";
import PaletteBlock from "components/forms/PaletteBlock";
import {
  OptionLabelWithPreview,
  Select,
  SingleValueWithPreview,
} from "ui/form/Select";
import { SingleValue } from "react-select";

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
  value = 0,
  onChange,
}) => {
  const [options, setOptions] = useState<PaletteIndexOption[]>([]);
  const [currentValue, setCurrentValue] = useState<PaletteIndexOption>();

  const previewAsSceneId = useAppSelector(
    (state) => state.editor.previewAsSceneId,
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, previewAsSceneId),
  );
  const palettesLookup = useAppSelector((state) =>
    getLocalisedPalettesLookup(state),
  );
  const defaultSpritePaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultSpritePaletteIds,
  );
  const dmgPalette = useMemo(getLocalisedDMGPalette, []);

  useEffect(() => {
    setOptions(
      Array.from(Array(8)).map((_, index) => ({
        value: index,
        label: l10n("TOOL_PALETTE_N", { number: index + 1 }),
        palette:
          palettesLookup[
            scene
              ? scene.spritePaletteIds?.[index] ||
                defaultSpritePaletteIds[index]
              : defaultSpritePaletteIds[index]
          ],
      })),
    );
  }, [scene, palettesLookup, defaultSpritePaletteIds]);

  useEffect(() => {
    setCurrentValue(options.find((o) => o.value === value));
  }, [value, options]);

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<PaletteIndexOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
      formatOptionLabel={(option: PaletteIndexOption) => {
        return (
          <OptionLabelWithPreview
            preview={
              <PaletteBlock
                type="sprite"
                colors={option.palette?.colors || dmgPalette.colors}
                size={20}
              />
            }
          >
            {option.label}
            {": "}
            {option.palette?.name || dmgPalette.name}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={
              <PaletteBlock
                type="sprite"
                colors={currentValue?.palette?.colors || dmgPalette.colors}
                size={20}
              />
            }
          >
            {currentValue?.label}
            {": "}
            {currentValue?.palette?.name || dmgPalette.name}
          </SingleValueWithPreview>
        ),
      }}
    />
  );
};
