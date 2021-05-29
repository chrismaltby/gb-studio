import React, { FC } from "react";
import { ObjPalette } from "store/features/entities/entitiesTypes";
import { Select } from "ui/form/Select";

interface ObjPaletteSelectProps {
  name: string;
  value?: ObjPalette;
  onChange?: (newValue: ObjPalette) => void;
}

interface ObjPaletteOption {
  value: ObjPalette;
  label: string;
}

const options: ObjPaletteOption[] = [
  { value: "OBP0", label: "OBP0" },
  { value: "OBP1", label: "OBP1" },
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
    />
  );
};

ObjPaletteSelect.defaultProps = {
  name: undefined,
  value: "OBP0",
};
