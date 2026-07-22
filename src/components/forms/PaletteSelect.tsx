import React, { memo, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  getLocalisedDMGPalette,
  getLocalisedPalettes,
} from "store/features/entities/entitiesSelectors";
import PaletteBlock, { PaletteBlockType } from "components/forms/PaletteBlock";
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
import { Palette } from "shared/lib/resources/types";

interface PaletteSelectProps extends SelectCommonProps {
  name: string;
  prefix?: string;
  value?: string;
  type?: PaletteBlockType;
  onChange?: (newId: string) => void;
  optional?: boolean;
  optionalLabel?: string;
  optionalDefaultPaletteId?: string;
  canKeep?: boolean;
  canRestore?: boolean;
  keepLabel?: string;
  canAuto?: boolean;
  autoPalette?: Palette;
}

interface PaletteOption extends Option {
  palette?: Palette;
}

const PaletteSelectPrefix = styled.div`
  min-width: 13px;
  padding-right: 2px;
  font-weight: bold;
`;

const PaletteSelectComponent = ({
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
  canAuto,
  autoPalette,
  keepLabel,
  ...selectProps
}: PaletteSelectProps) => {
  const palettes = useAppSelector((state) => getLocalisedPalettes(state));
  const dmgPalette = useMemo(getLocalisedDMGPalette, []);

  const options = useMemo(
    () =>
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
        canAuto
          ? ([
              {
                value: "auto",
                label: l10n("FIELD_AUTOMATIC"),
                palette: autoPalette,
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
        })),
      ),
    [
      palettes,
      canKeep,
      canRestore,
      keepLabel,
      optional,
      optionalDefaultPaletteId,
      optionalLabel,
      dmgPalette,
      canAuto,
      autoPalette,
    ],
  );

  const currentValue = useMemo<PaletteOption>(() => {
    const matchingOption = options.find(
      (option) => option.value === (value ?? (optional ? "" : undefined)),
    );
    if (matchingOption) {
      return matchingOption;
    }
    if (optional) {
      return options.find((option) => option.value === "") as PaletteOption;
    }
    return {
      value: "",
      label: dmgPalette.name,
      palette: dmgPalette,
    };
  }, [options, optional, value, dmgPalette]);

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

export const PaletteSelect = memo<PaletteSelectProps>(PaletteSelectComponent);
