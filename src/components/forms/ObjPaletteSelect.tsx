import PaletteBlock from "components/forms/PaletteBlock";
import React, { FC } from "react";
import { ObjPalette } from "shared/lib/entities/entitiesTypes";
import {
  OptionLabelWithPreview,
  Select,
  SingleValueWithPreview,
} from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";
import { useAppSelector } from "store/hooks";

interface ObjPaletteSelectProps {
  name: string;
  value?: ObjPalette;
  onChange?: (newValue: ObjPalette) => void;
}

interface ObjPaletteOption {
  value: ObjPalette;
  label: string;
  colors: string[];
}

export const ObjPaletteSelect: FC<ObjPaletteSelectProps> = ({
  name,
  value = "OBP0",
  onChange,
}) => {
  const settings = useAppSelector((state) => state.project.present.settings);
  const obp0 = settings.defaultOBP0;
  const obp1 = settings.defaultOBP1;
  const dmgPal = [settings.customColorsWhite, settings.customColorsLight, settings.customColorsDark, settings.customColorsBlack];
  const obp0Colors = [dmgPal[obp0[1]], dmgPal[obp0[2]], "", dmgPal[obp0[3]]];
  const obp1Colors = [dmgPal[obp1[1]], dmgPal[obp1[2]], "", dmgPal[obp1[3]]];
  const options: ObjPaletteOption[] = [
    {
      value: "OBP0",
      label: "0: OBP0",
      colors: obp0Colors,
    },
    {
      value: "OBP1",
      label: "1: OBP1",
      colors: obp1Colors,
    },
  ];

  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: SingleValue<ObjPaletteOption>) => {
        if (newValue) {
          onChange?.(newValue.value);
        }
      }}
      formatOptionLabel={(option: ObjPaletteOption) => {
        return (
          <OptionLabelWithPreview
            preview={
              <PaletteBlock type="sprite" colors={option.colors} size={20} />
            }
          >
            {l10n("FIELD_PALETTE")} {option.label}
          </OptionLabelWithPreview>
        );
      }}
      components={{
        SingleValue: () => (
          <SingleValueWithPreview
            preview={
              <PaletteBlock
                type="sprite"
                colors={currentValue?.colors || []}
                size={20}
              />
            }
          >
            {l10n("FIELD_PALETTE")} {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
    />
  );
};
