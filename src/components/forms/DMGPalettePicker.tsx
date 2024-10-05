import React, { useCallback } from "react";
import {useAppSelector } from "store/hooks";
import { NumberInput } from "ui/form/NumberInput";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import styled from "styled-components";
import type { MonoPalette } from "shared/lib/entities/entitiesTypes";

type DMGPalettePickerProps = {
  name: string
  palette: MonoPalette
  isSpritePalette: boolean
  onChange: (palette: MonoPalette) => void;
  showName?: boolean
};

export const DMGPalettePicker = ({
  name,
  palette,
  isSpritePalette,
  onChange,
  showName
}: DMGPalettePickerProps) => {

  const settings = useAppSelector((state) => state.project.present.settings);
  const dmgColors = [settings.customColorsWhite, settings.customColorsLight, settings.customColorsDark, settings.customColorsBlack];
  const fields = isSpritePalette ? [1, 2, 3] : [0, 1, 2, 3];
  const width = showName ? `max-width: ${isSpritePalette ? 121 : 245}px;` : "width: 100%";
  const DMGPalettePickerStyle = styled.div`
    display: flex;
    ${width}
    box-sizing: border-box;
  `

  const DMGPaletteTextStyle = styled.div`
    width: 9px;
    color: grey;
    font-size: 9px;
    text-align: center;
    transform-origin:50% 50%;
    transform: rotate(90deg) translate(-7px,8px);
  `
  function getRows() {
    return fields.map((index) =>
      <NumberInput
        key={index}
        style={{backgroundColor:`#${dmgColors[palette[index]]}`, color:`#${dmgColors[(palette[index]+2)%4]}`}}
        id={`${name}_${index}`}
        name={`${name}_${index}`}
        min={0}
        max={3}
        value={palette[index]}
        onChange={(e) => {
          let newPalette = [palette[0], palette[1], palette[2], palette[3]];
          newPalette[index] = castEventToInt(e, 0);
          onChange(newPalette as MonoPalette);
        }}
      />
    );
  }

  if (showName) return <DMGPalettePickerStyle><DMGPaletteTextStyle>{name.toUpperCase()}</DMGPaletteTextStyle>{getRows()}</DMGPalettePickerStyle>;
  else return <DMGPalettePickerStyle>{getRows()}</DMGPalettePickerStyle>;
};
