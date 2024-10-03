import React, { useCallback } from "react";
import {useAppSelector } from "store/hooks";
import { NumberInput } from "ui/form/NumberInput";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import styled, { css } from "styled-components";

type DMGPalettePickerProps = {
  name: string
  palette: [number, number, number, number]
  isSpritePalette: boolean
  onChange: (palette: [number, number, number, number]) => void;
};

export const DMGPalettePicker = ({
  name,
  palette,
  isSpritePalette,
  onChange
}: DMGPalettePickerProps) => {

  const settings = useAppSelector((state) => state.project.present.settings);
  const dmgColors = [settings.customColorsWhite, settings.customColorsLight, settings.customColorsDark, settings.customColorsBlack];
  const fields = isSpritePalette ? [1, 2, 3] : [0, 1, 2, 3];

  const DMGPalettePickerStyle = styled.div`
    display: flex;
    width: 100%;
    box-sizing: border-box;`

  function getRows() {
    return fields.map((index) =>
      <NumberInput
        style={{backgroundColor:`#${dmgColors[palette[index]]}`, color:`#${dmgColors[(palette[index]+2)%4]}`}}
        id={`${name}_${index}`}
        name={`${name}_${index}`}
        min={0}
        max={3}
        value={palette[index]}
        onChange={(e) => {
          let newPalette = [palette[0], palette[1], palette[2], palette[3]];
          newPalette[index] = castEventToInt(e, 0);
          onChange(newPalette as [number, number, number, number]);
        }}
      />
    );
  }

  return <DMGPalettePickerStyle>{getRows()}</DMGPalettePickerStyle>;
};
