import React, { memo, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import {
  getLocalisedDMGPalette,
  getLocalisedPalettesLookup,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import PaletteBlock from "components/forms/PaletteBlock";
import {
  OptionLabelWithPreview,
  Select,
  SingleValueWithPreview,
} from "ui/form/Select";
import { SingleValue } from "react-select";
import { Palette } from "shared/lib/resources/types";

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

const PaletteIndexSelectComponent = ({
  name,
  value = 0,
  onChange,
}: PaletteIndexSelectProps) => {
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

  const options = useMemo(
    () =>
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
    [scene, palettesLookup, defaultSpritePaletteIds],
  );

  const currentValue = useMemo(
    () => options.find((option) => option.value === value),
    [value, options],
  );

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

export const PaletteIndexSelect = memo<PaletteIndexSelectProps>(
  PaletteIndexSelectComponent,
);
