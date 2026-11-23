import React, { FC, useMemo } from "react";
import { SingleValue } from "react-select";
import { FormField, FormRow } from "ui/form/layout/FormLayout";
import { Select } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import { SliderField } from "ui/form/SliderField";
import { CheckboxField } from "ui/form/CheckboxField";
import { Label } from "ui/form/Label";
import clamp from "shared/lib/helpers/clamp";
import styled from "styled-components";
import { VibratoWaveformPreview } from "./VibratoWaveformPreview";
import { PitchSelect } from "components/music/form/PitchSelect";
import { DutyCycleSelect } from "components/music/form/DutyCycleSelect";
import { NumberInput } from "ui/form/NumberInput";

type SelectOption = {
  value: number;
  label: string;
};

interface EffectParamsFormProps {
  effectCode?: number | null;
  value?: number | null;
  onChange?: (effectParam: number | null) => void;
  onChangeNote?: (note: number | null) => void;
  note?: number;
}

const waveformOptions: SelectOption[] = [
  { value: 0x0, label: "0000000000000000000000000" },
  { value: 0x1, label: "0101010101010101010101010" },
  { value: 0x2, label: "0011001100110011001100110" },
  { value: 0x3, label: "0111011101110111011101110" },
  { value: 0x4, label: "0000111100001111000011110" },
  { value: 0x5, label: "0101111101011111010111110" },
  { value: 0x6, label: "0011111100111111001111110" },
  { value: 0x7, label: "0111111101111111011111110" },
  { value: 0x8, label: "0000000011111111000000001" },
  { value: 0x9, label: "0101010111111111010101011" },
  { value: 0xa, label: "0011001111111111001100111" },
  { value: 0xb, label: "0111011111111111011101111" },
  { value: 0xc, label: "0000111111111111000011111" },
  { value: 0xd, label: "0101111111111111010111111" },
  { value: 0xe, label: "0011111111111111001111111" },
  { value: 0xf, label: "0111111111111111011111111" },
];

const VibrateWaveFormOptionWrapper = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const EffectParamsForm: FC<EffectParamsFormProps> = ({
  effectCode,
  value,
  onChange,
  note,
  onChangeNote,
}) => {
  const effectParam = value ?? 0;

  const effectParams = useMemo(
    () => ({
      x: (effectParam >> 4) & 0xf,
      y: effectParam & 0xf,
    }),
    [effectParam],
  );

  const routineOptions: SelectOption[] = useMemo(
    () => [
      { value: 0, label: `${l10n("FIELD_ROUTINE")} 0` },
      { value: 1, label: `${l10n("FIELD_ROUTINE")} 1` },
      { value: 2, label: `${l10n("FIELD_ROUTINE")} 2` },
      { value: 3, label: `${l10n("FIELD_ROUTINE")} 3` },
    ],
    [],
  );

  const onChangeParamField = (field: "x" | "y") => (fieldValue: number) => {
    const nextValue =
      field === "x"
        ? ((fieldValue & 0xf) << 4) | (effectParams.y & 0xf)
        : ((effectParams.x & 0xf) << 4) | (fieldValue & 0xf);

    onChange?.(nextValue);
  };

  const onChangeFullValue = (nextValue: number | null) => {
    onChange?.(nextValue);
  };

  if (effectCode === null || effectCode === undefined) {
    return null;
  }

  switch (effectCode) {
    case 0: // Arpeggio
      return (
        <>
          <FormRow>
            <SliderField
              label={l10n("FIELD_FIRST_NOTE_PLUS_SEMITONE")}
              name="effectParamsX"
              value={effectParams.x}
              min={0}
              max={15}
              onChange={(nextValue) => {
                onChangeParamField("x")(nextValue ?? 0);
              }}
            />
          </FormRow>
          <FormRow>
            <SliderField
              label={l10n("FIELD_SECOND_NOTE_PLUS_SEMITONE")}
              name="effectParamsY"
              value={effectParams.y}
              min={0}
              max={15}
              onChange={(nextValue) => {
                onChangeParamField("y")(nextValue ?? 0);
              }}
            />
          </FormRow>
        </>
      );

    case 1: // Portamento Up
    case 2: // Portamento Down
      return (
        <FormRow>
          <SliderField
            label={l10n("FIELD_UNITS_PER_TICK")}
            name="effectParam"
            value={effectParam}
            min={0}
            max={255}
            onChange={(nextValue) => {
              onChangeFullValue(nextValue ?? 0);
            }}
          />
        </FormRow>
      );

    case 3: {
      // Tone Portamento
      return (
        <>
          <FormRow>
            <FormField name="note" label={l10n("FIELD_TOWARDS_NOTE")}>
              <PitchSelect
                name="note"
                value={note}
                onChange={(newNote) => {
                  onChangeNote?.(newNote);
                }}
              />
            </FormField>
          </FormRow>
          <FormRow>
            <SliderField
              label={l10n("FIELD_UNITS_PER_TICK")}
              name="effectParam"
              value={effectParam}
              min={0}
              max={255}
              onChange={(nextValue) => {
                onChangeFullValue(nextValue ?? 0);
              }}
            />
          </FormRow>
        </>
      );
    }

    case 4: {
      // Vibrato
      const selectedWaveform =
        waveformOptions.find((option) => option.value === effectParams.x) ??
        null;

      return (
        <>
          <FormRow>
            <SliderField
              name="effectParamsY"
              value={effectParams.y}
              label={l10n("FIELD_DEPTH")}
              min={0}
              max={15}
              onChange={(nextValue) => {
                onChangeParamField("y")(nextValue ?? 0);
              }}
            />
          </FormRow>
          <FormRow>
            <FormField name="effectParam" label={l10n("FIELD_WAVEFORM")}>
              <Select
                name="effectParam"
                value={selectedWaveform}
                options={waveformOptions}
                onChange={(selected: SingleValue<SelectOption>) => {
                  if (selected) {
                    onChangeParamField("x")(selected.value);
                  }
                }}
                formatOptionLabel={(option: SelectOption) => (
                  <VibrateWaveFormOptionWrapper>
                    <span style={{ paddingRight: 8 }}>{option.value}:</span>
                    <VibratoWaveformPreview waveform={option.label} />
                  </VibrateWaveFormOptionWrapper>
                )}
              />
            </FormField>
          </FormRow>
        </>
      );
    }

    case 5: // Set Master Volume
      return (
        <>
          <FormRow>
            <SliderField
              name="effectParamsX"
              value={effectParams.x}
              label={l10n("FIELD_LEFT_SPEAKER")}
              min={0}
              max={15}
              onChange={(nextValue) => {
                onChangeParamField("x")(nextValue ?? 0);
              }}
            />
          </FormRow>
          <FormRow>
            <SliderField
              name="effectParamsY"
              value={effectParams.y}
              label={l10n("FIELD_RIGHT_SPEAKER")}
              min={0}
              max={15}
              onChange={(nextValue) => {
                onChangeParamField("y")(nextValue ?? 0);
              }}
            />
          </FormRow>
        </>
      );

    case 6: {
      // Call Routine
      const selectedRoutine =
        routineOptions.find((option) => option.value === effectParams.y % 4) ??
        null;

      return (
        <FormRow>
          <FormField name="effectParam" label={l10n("FIELD_ROUTINE")}>
            <Select
              name="effectParam"
              value={selectedRoutine}
              options={routineOptions}
              onChange={(selected: SingleValue<SelectOption>) => {
                if (selected) {
                  onChangeParamField("y")(selected.value);
                }
              }}
            />
          </FormField>
        </FormRow>
      );
    }

    case 7: // Note Delay
      return (
        <FormRow>
          <SliderField
            label={l10n("FIELD_TICKS")}
            name="effectParam"
            value={effectParam}
            min={0}
            max={20}
            onChange={(nextValue) => {
              onChangeFullValue(nextValue ?? 0);
            }}
          />
        </FormRow>
      );

    case 8: {
      // Set Panning (NR51): high nibble (x) = left speaker, low nibble (y) = right speaker
      const renderPanningFieldCheckbox = (
        param: "x" | "y",
        label: string,
        name: string,
        bit: 0x1 | 0x2 | 0x4 | 0x8,
      ) => (
        <CheckboxField
          label={label}
          name={name}
          checked={(effectParams[param] & bit) === bit}
          onChange={(e) => {
            const checked = e.target.checked;
            onChangeParamField(param)(
              checked ? effectParams[param] | bit : effectParams[param] & ~bit,
            );
          }}
        />
      );

      return (
        <>
          <FormRow>
            <Label style={{ width: "100%" }}>
              {l10n("FIELD_LEFT_SPEAKER")}
            </Label>
            <Label style={{ width: "100%" }}>
              {l10n("FIELD_RIGHT_SPEAKER")}
            </Label>
          </FormRow>
          <FormRow>
            {renderPanningFieldCheckbox(
              "x",
              l10n("FIELD_CHANNEL_DUTY_1"),
              "left_panning_duty_1",
              0x1,
            )}
            {renderPanningFieldCheckbox(
              "y",
              l10n("FIELD_CHANNEL_DUTY_1"),
              "right_panning_duty_1",
              0x1,
            )}
          </FormRow>
          <FormRow>
            {renderPanningFieldCheckbox(
              "x",
              l10n("FIELD_CHANNEL_DUTY_2"),
              "left_panning_duty_2",
              0x2,
            )}
            {renderPanningFieldCheckbox(
              "y",
              l10n("FIELD_CHANNEL_DUTY_2"),
              "right_panning_duty_2",
              0x2,
            )}
          </FormRow>
          <FormRow>
            {renderPanningFieldCheckbox(
              "x",
              l10n("FIELD_CHANNEL_WAVE"),
              "left_panning_wave",
              0x4,
            )}
            {renderPanningFieldCheckbox(
              "y",
              l10n("FIELD_CHANNEL_WAVE"),
              "right_panning_wave",
              0x4,
            )}
          </FormRow>
          <FormRow>
            {renderPanningFieldCheckbox(
              "x",
              l10n("FIELD_CHANNEL_NOISE"),
              "left_panning_noise",
              0x8,
            )}
            {renderPanningFieldCheckbox(
              "y",
              l10n("FIELD_CHANNEL_NOISE"),
              "right_panning_noise",
              0x8,
            )}
          </FormRow>
        </>
      );
    }

    case 9: {
      // Set Duty Cycle
      return (
        <FormRow>
          <FormField name="effectParam" label={l10n("FIELD_DUTY_CYCLE")}>
            <DutyCycleSelect
              name={"effectParam"}
              value={effectParam}
              onChange={onChangeFullValue}
              isEffectParam
            />
          </FormField>
        </FormRow>
      );
    }

    case 10: // Volume Slide
      return (
        <>
          <FormRow>
            <SliderField
              label={l10n("FIELD_VOLUME_UP")}
              name="effectParamsX"
              value={effectParams.x}
              min={0}
              max={15}
              onChange={(nextValue) => {
                onChangeParamField("x")(nextValue ?? 0);
              }}
            />
          </FormRow>
          <FormRow>
            <SliderField
              label={l10n("FIELD_VOLUME_DOWN")}
              name="effectParamsY"
              value={effectParams.y}
              min={0}
              max={15}
              onChange={(nextValue) => {
                onChangeParamField("y")(nextValue ?? 0);
              }}
            />
          </FormRow>
        </>
      );

    case 11: {
      // Position Jump
      const inputValue = String(clamp(effectParam, 0, 63));

      return (
        <>
          <FormRow>
            <Label>{l10n("FIELD_TO_PATTERN")}</Label>
          </FormRow>
          <FormRow>
            <NumberInput
              type="number"
              min={0}
              max={63}
              placeholder="0"
              value={inputValue}
              onChange={(e) => {
                const nextValue =
                  e.currentTarget.value.length > 0
                    ? clamp(parseInt(e.currentTarget.value, 10), 0, 63)
                    : 0;
                onChangeFullValue(nextValue);
              }}
            />
          </FormRow>
          {effectParam === 0 ? (
            <FormRow>
              <Label>{l10n("FIELD_JUMP_TO_NEXT_PATTERN")}</Label>
            </FormRow>
          ) : null}
        </>
      );
    }

    case 12: // Set Volume
      return (
        <>
          <FormRow>
            <SliderField
              name="effectParamsY"
              label={l10n("FIELD_VOLUME")}
              value={effectParams.y}
              min={0}
              max={15}
              onChange={(nextValue) => {
                onChangeParamField("y")(nextValue ?? 0);
              }}
            />
          </FormRow>
          <FormRow>
            <CheckboxField
              label={l10n("FIELD_CHANGE_ENVELOPE")}
              name="change_envelope"
              checked={effectParams.x !== 0}
              onChange={(e) => {
                onChangeParamField("x")(e.target.checked ? 8 : 0);
              }}
            />
          </FormRow>
          <FormRow>
            {effectParams.x !== 0 ? (
              <SliderField
                name="effectParamsX"
                value={effectParams.x - 8}
                min={-7}
                max={7}
                onChange={(nextValue) => {
                  onChangeParamField("x")((nextValue ?? 0) + 8);
                }}
              />
            ) : null}
          </FormRow>
        </>
      );

    case 13: {
      // Pattern Break
      const inputValue = clamp(effectParam - 1, 0, 63);

      return (
        <>
          <FormRow>
            <Label>{l10n("FIELD_START_ROW")}</Label>
          </FormRow>
          <FormRow>
            <NumberInput
              type="number"
              min={0}
              max={63}
              placeholder="0"
              value={inputValue}
              onChange={(e) => {
                const nextValue =
                  e.currentTarget.value.length > 0
                    ? clamp(parseInt(e.currentTarget.value, 10) + 1, 1, 64)
                    : 1;
                onChangeFullValue(nextValue);
              }}
            />
          </FormRow>
        </>
      );
    }

    case 14: // Note Cut
      return (
        <FormRow>
          <SliderField
            name="effectParam"
            label={l10n("FIELD_TICKS")}
            value={effectParam}
            min={0}
            max={20}
            onChange={(nextValue) => {
              onChangeFullValue(nextValue ?? 0);
            }}
          />
        </FormRow>
      );

    case 15: // Set Speed
      return (
        <FormRow>
          <SliderField
            name="effectParam"
            label={l10n("FIELD_TICKS_PER_ROW")}
            value={effectParam}
            min={1}
            max={20}
            onChange={(nextValue) => {
              onChangeFullValue(nextValue ?? 0);
            }}
          />
        </FormRow>
      );

    default:
      return null;
  }
};
