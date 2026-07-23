import React, { memo, useCallback, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  Select,
  OptionLabelWithPreview,
  SingleValueWithPreview,
  SelectCommonProps,
  Option,
} from "ui/form/Select";
import { SingleValue } from "react-select";
import l10n from "shared/lib/lang/l10n";
import { useMusicNotePreview } from "components/music/hooks/useMusicNotePreview";

type InstrumentOption = {
  value: number;
  label: string;
};

const defaultInstrumentOptions = Array(15)
  .fill("")
  .map((_, i) => ({
    value: i,
    label: `Instrument ${i + 1}`,
  })) as InstrumentOption[];

interface LabelColorProps {
  $instrument?: number;
}

const LabelColor = styled.div<LabelColorProps>`
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid black;
  flex-shrink: 0;
  background: ${(props) =>
    props.$instrument !== undefined
      ? `var(--instrument-${props.$instrument}-color)`
      : "black"};

  &::before {
    content: "";
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: 2px;
    background: rgba(0, 0, 0, 0.25);
  }
  &::after {
    content: "";
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    height: 2px;
    background: rgba(255, 255, 255, 0.6);
    mix-blend-mode: overlay;
  }
`;

interface InstrumentSelectProps extends SelectCommonProps {
  name: string;
  value?: number;
  onChange?: (newId: number) => void;
  noneLabel?: string;
  previewNoteOnChange?: boolean;
}

export const InstrumentSelect = memo(
  ({
    value,
    onChange,
    noneLabel,
    previewNoteOnChange,
    ...selectProps
  }: InstrumentSelectProps) => {
    const playPreview = useMusicNotePreview();

    const dutyInstruments = useAppSelector(
      (state) => state.trackerDocument.present.song?.dutyInstruments,
    );
    const waveInstruments = useAppSelector(
      (state) => state.trackerDocument.present.song?.waveInstruments,
    );
    const noiseInstruments = useAppSelector(
      (state) => state.trackerDocument.present.song?.noiseInstruments,
    );

    const selectedChannel = useAppSelector(
      (state) => state.tracker.selectedChannel,
    );

    const options = useMemo(() => {
      let instruments = defaultInstrumentOptions;
      if (dutyInstruments && waveInstruments && noiseInstruments) {
        switch (selectedChannel) {
          case 0:
          case 1:
            instruments = dutyInstruments.map((instrument) => ({
              value: instrument.index,
              label:
                String(instrument.index + 1).padStart(2, "0") +
                ": " +
                (instrument.name || `Duty ${instrument.index + 1}`),
            }));
            break;
          case 2:
            instruments = waveInstruments.map((instrument) => ({
              value: instrument.index,
              label:
                String(instrument.index + 1).padStart(2, "0") +
                ": " +
                (instrument.name || `Wave ${instrument.index + 1}`),
            }));
            break;
          case 3:
            instruments = noiseInstruments.map((instrument) => ({
              value: instrument.index,
              label:
                String(instrument.index + 1).padStart(2, "0") +
                ": " +
                (instrument.name || `Noise ${instrument.index + 1}`),
            }));
            break;
        }
      }
      return instruments;
    }, [dutyInstruments, noiseInstruments, selectedChannel, waveInstruments]);

    const currentValue = useMemo(
      () =>
        options.find((option) => option.value === value) || {
          value: -1,
          label: noneLabel ?? l10n("FIELD_NONE"),
        },
      [noneLabel, options, value],
    );

    const onSelectChange = useCallback(
      (newValue: SingleValue<InstrumentOption>) => {
        if (newValue) {
          const value = newValue.value;

          onChange?.(value);
          if (previewNoteOnChange) {
            playPreview({
              instrumentId: value,
            });
          }
        }
      },
      [onChange, playPreview, previewNoteOnChange],
    );

    const filterOption = useCallback((item: Option, searchTerm: string) => {
      const trimmedSearchTerm = searchTerm.toLocaleUpperCase().trim();
      const isNumberSearch = !!trimmedSearchTerm.match(/^[0-9]+$/);
      // Search for a number within instrument range
      // only show instruments with matching ids
      if (isNumberSearch && parseInt(trimmedSearchTerm, 10) <= 15) {
        return String(item.value + 1)
          .padStart(2, "0")
          .includes(trimmedSearchTerm);
      }
      // Otherwise search text of labels
      const searchParts = trimmedSearchTerm.split(" ");
      const labelUppercase = item.label.toLocaleUpperCase();
      return searchParts.every((part) => labelUppercase.includes(part));
    }, []);

    return (
      <Select
        classNamePrefix="CustomSelect--Left CustomSelect--WidthAuto"
        value={currentValue}
        options={options}
        onChange={onSelectChange}
        formatOptionLabel={(option: InstrumentOption) => {
          return (
            <OptionLabelWithPreview
              preview={<LabelColor $instrument={Number(option.value)} />}
            >
              {option.label}
            </OptionLabelWithPreview>
          );
        }}
        components={{
          SingleValue: () =>
            !currentValue || currentValue.value === -1 ? (
              <SingleValueWithPreview>
                {currentValue?.label}
              </SingleValueWithPreview>
            ) : (
              <SingleValueWithPreview
                preview={<LabelColor $instrument={Number(value ?? 1)} />}
              >
                {currentValue?.label}
              </SingleValueWithPreview>
            ),
        }}
        filterOption={filterOption}
        {...selectProps}
      />
    );
  },
);
