import PaletteBlock from "components/forms/PaletteBlock";
import React, { FC } from "react";
import { ObjPalette } from "store/features/entities/entitiesTypes";
import {
  OptionLabelWithPreview,
  Select,
  SingleValueWithPreview,
} from "ui/form/Select";

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

const options: ObjPaletteOption[] = [
  {
    value: "OBP0",
    label: "Palette 0: OBP0",
    colors: ["E8F8E0", "B0F088", "", "202850"],
  },
  {
    value: "OBP1",
    label: "Palette 1: OBP1",
    colors: ["E8F8E0", "509878", "", "202850"],
  },
];

export const ObjPaletteSelect: FC<ObjPaletteSelectProps> = ({
  name,
  value,
  onChange,
}) => {
  const currentValue = options.find((o) => o.value === value);
  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: ObjPaletteOption) => {
        onChange?.(newValue.value);
      }}
      formatOptionLabel={(option: ObjPaletteOption) => {
        return (
          <OptionLabelWithPreview
            preview={
              <PaletteBlock type="sprite" colors={option.colors} size={20} />
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
              <PaletteBlock
                type="sprite"
                colors={currentValue?.colors || []}
                size={20}
              />
            }
          >
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
    />
  );
};

ObjPaletteSelect.defaultProps = {
  name: undefined,
  value: "OBP0",
};
