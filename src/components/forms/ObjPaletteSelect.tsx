import PaletteBlock from "components/forms/PaletteBlock";
import React, { FC, useMemo } from "react";
import {
  OptionLabelWithPreview,
  Select,
  SingleValueWithPreview,
} from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";
import { MonoOBJPalette, ObjPalette } from "shared/lib/resources/types";
import { DMG_PALETTE } from "consts";

interface ObjPaletteSelectProps {
  name: string;
  value?: ObjPalette;
  onChange?: (newValue: ObjPalette) => void;
  monoPalettes: [MonoOBJPalette, MonoOBJPalette];
}

interface ObjPaletteOption {
  value: ObjPalette;
  label: string;
  colors: string[];
}

export const ObjPaletteSelect: FC<ObjPaletteSelectProps> = ({
  name,
  value = "OBP0",
  monoPalettes,
  onChange,
}) => {
  const options: ObjPaletteOption[] = useMemo(() => {
    return [
      {
        value: "OBP0",
        label: "0: OBP0",
        colors: [
          DMG_PALETTE.colors[monoPalettes[0][0]],
          DMG_PALETTE.colors[monoPalettes[0][1]],
          "",
          DMG_PALETTE.colors[monoPalettes[0][2]],
        ],
      },
      {
        value: "OBP1",
        label: "1: OBP1",
        colors: [
          DMG_PALETTE.colors[monoPalettes[1][0]],
          DMG_PALETTE.colors[monoPalettes[1][1]],
          "",
          DMG_PALETTE.colors[monoPalettes[1][2]],
        ],
      },
    ];
  }, [monoPalettes]);

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
