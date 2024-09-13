import React, { FC, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  getLocalisedDMGPalette,
  getLocalisedPalettes,
} from "store/features/entities/entitiesState";
import { Palette } from "shared/lib/entities/entitiesTypes";
import PaletteBlock from "components/forms/PaletteBlock";
import {
  Option,
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  FormatFolderLabel,
} from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SingleValue } from "react-select";

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
  canRestore?: boolean;
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
  canRestore,
  keepLabel,
  ...selectProps
}) => {
  const palettes = useAppSelector((state) => getLocalisedPalettes(state));
  const [options, setOptions] = useState<PaletteOption[]>([]);
  const [currentPalette, setCurrentPalette] = useState<Palette>();
  const [currentValue, setCurrentValue] = useState<PaletteOption>();
  const dmgPalette = useMemo(getLocalisedDMGPalette, []);

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
        canRestore
          ? ([
              {
                value: "restore",
                label: l10n("FIELD_RESTORE_DEFAULT"),
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
                  dmgPalette,
              },
            ] as PaletteOption[])
          : ([] as PaletteOption[]),
        {
          value: dmgPalette.id,
          label: dmgPalette.name,
          palette: dmgPalette,
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
    canRestore,
    keepLabel,
    optional,
    optionalDefaultPaletteId,
    optionalLabel,
    dmgPalette,
  ]);

  useEffect(() => {
    if (value === dmgPalette.id) {
      setCurrentPalette(dmgPalette);
    } else {
      setCurrentPalette(palettes.find((v) => v.id === value));
    }
  }, [dmgPalette, palettes, value]);

  useEffect(() => {
    if (canKeep && value === "keep") {
      setCurrentValue({
        value: "keep",
        label: keepLabel || "Keep",
      });
    } else if (canRestore && value === "restore") {
      setCurrentValue({
        value: "restore",
        label: l10n("FIELD_RESTORE_DEFAULT"),
      });
    } else if (currentPalette) {
      setCurrentValue({
        value: currentPalette.id,
        label: `${currentPalette.name}`,
        palette: currentPalette,
      });
    } else if (optional) {
      const optionalPalette =
        palettes.find((p) => p.id === optionalDefaultPaletteId) || dmgPalette;
      setCurrentValue({
        value: "",
        label: optionalLabel || "None",
        palette: optionalPalette as Palette,
      });
    } else {
      setCurrentValue({
        value: "",
        label: dmgPalette.name,
        palette: dmgPalette,
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
    canRestore,
    dmgPalette,
  ]);

  const onSelectChange = (newValue: SingleValue<Option>) => {
    if (newValue) {
      onChange?.(newValue.value);
    }
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
            <FormatFolderLabel label={option.label} />
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
            <FormatFolderLabel label={currentValue?.label} />
          </SingleValueWithPreview>
        ),
      }}
      {...selectProps}
    />
  );
};
