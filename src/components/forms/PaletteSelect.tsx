import React, { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "../../store/configureStore";
import { paletteSelectors } from "../../store/features/entities/entitiesState";
import { Palette } from "../../store/features/entities/entitiesTypes";
import PaletteBlock from "../library/PaletteBlock";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "../ui/form/Select";

interface PaletteSelectProps extends SelectCommonProps {
  name: string;
  value?: string;
  type?: "tile" | "sprite";
  onChange?: (newId: string) => void;
}

interface PaletteOption extends Option {
  palette: Palette;
}

export const PaletteSelect: FC<PaletteSelectProps> = ({
  value,
  type,
  onChange,
  ...selectProps
}) => {
  const palettes = useSelector((state: RootState) =>
    paletteSelectors.selectAll(state)
  );
  const [options, setOptions] = useState<PaletteOption[]>([]);
  const [currentPalette, setCurrentPalette] = useState<Palette>();
  const [currentValue, setCurrentValue] = useState<PaletteOption>();

  useEffect(() => {
    setOptions(
      palettes.map((palette) => ({
        value: palette.id,
        label: palette.name,
        palette,
      }))
    );
  }, [palettes]);

  useEffect(() => {
    setCurrentPalette(palettes.find((v) => v.id === value));
  }, [palettes, value]);

  useEffect(() => {
    if (currentPalette) {
      setCurrentValue({
        value: currentPalette.id,
        label: `${currentPalette.name}`,
        palette: currentPalette,
      });
    }
  }, [currentPalette]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
  };

  return (
    <Select
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: PaletteOption) => {
        return (
          <OptionLabelWithPreview
            preview={
              <PaletteBlock
                type={type}
                colors={option.palette.colors || []}
                size={20}
              />
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
                type={type}
                colors={currentPalette?.colors || []}
                size={20}
              />
            }
          >
            {currentPalette?.name}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
