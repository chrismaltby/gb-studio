import React, { FC, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { DMG_PALETTE } from "../../consts";
import { RootState } from "store/configureStore";
import { paletteSelectors } from "store/features/entities/entitiesState";
import { Palette } from "store/features/entities/entitiesTypes";
import PaletteBlock from "../library/PaletteBlock";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
} from "ui/form/Select";

interface PaletteSelectProps extends SelectCommonProps {
  name: string;
  prefix?: string;
  value?: string;
  type?: "tile" | "sprite";
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
  optionalDefaultPaletteId?: string;
  canKeep?: boolean;
  keepLabel?: string;
}

interface PaletteOption extends Option {
  palette?: Palette;
}

const PaletteSelectPrefix = styled.div`
  min-width: 13px;
  padding-right: 2px;
  font-weight: bold;
`;

export const PaletteSelect: FC<PaletteSelectProps> = ({
  name,
  value,
  prefix,
  type,
  onChange,
  optional,
  optionalLabel,
  optionalDefaultPaletteId,
  canKeep,
  keepLabel,
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
      ([] as PaletteOption[]).concat(
        canKeep
          ? ([
              {
                value: "keep",
                label: keepLabel || "Keep",
              },
            ] as PaletteOption[])
          : [],
        optional
          ? ([
              {
                value: "",
                label: optionalLabel || "None",
                palette:
                  palettes.find((p) => p.id === optionalDefaultPaletteId) ||
                  DMG_PALETTE,
              },
            ] as PaletteOption[])
          : ([] as PaletteOption[]),
        {
          value: DMG_PALETTE.id,
          label: DMG_PALETTE.name,
          palette: DMG_PALETTE as Palette,
        },
        palettes.map((palette) => ({
          value: palette.id,
          label: palette.name,
          palette,
        }))
      )
    );
  }, [
    palettes,
    canKeep,
    keepLabel,
    optional,
    optionalDefaultPaletteId,
    optionalLabel,
  ]);

  useEffect(() => {
    if (value === DMG_PALETTE.id) {
      setCurrentPalette(DMG_PALETTE as Palette);
    } else {
      setCurrentPalette(palettes.find((v) => v.id === value));
    }
  }, [palettes, value]);

  useEffect(() => {
    if (canKeep && value === "keep") {
      setCurrentValue({
        value: "keep",
        label: keepLabel || "Keep",
      });
    } else if (currentPalette) {
      setCurrentValue({
        value: currentPalette.id,
        label: `${currentPalette.name}`,
        palette: currentPalette,
      });
    } else if (optional) {
      const optionalPalette =
        palettes.find((p) => p.id === optionalDefaultPaletteId) || DMG_PALETTE;
      setCurrentValue({
        value: "",
        label: optionalLabel || "None",
        palette: optionalPalette as Palette,
      });
    } else {
      setCurrentValue({
        value: "",
        label: DMG_PALETTE.name,
        palette: DMG_PALETTE as Palette,
      });
    }
  }, [
    currentPalette,
    optionalDefaultPaletteId,
    optional,
    optionalLabel,
    palettes,
    canKeep,
    keepLabel,
    value,
  ]);

  const onSelectChange = (newValue: Option) => {
    onChange?.(newValue.value);
  };

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={(option: PaletteOption) => {
        return (
          <OptionLabelWithPreview
            preview={
              <PaletteBlock
                type={type}
                colors={option?.palette?.colors || []}
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
                colors={currentValue?.palette?.colors || []}
                size={20}
              />
            }
          >
            {prefix && <PaletteSelectPrefix>{prefix}</PaletteSelectPrefix>}
            {currentValue?.label}
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
