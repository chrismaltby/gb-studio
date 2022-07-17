import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import {
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
} from "ui/form/FormLayout";
import { RootState } from "store/configureStore";
import { PatternCell } from "lib/helpers/uge/song/PatternCell";
import { Select, Option, OptionLabelWithInfo } from "ui/form/Select";
import l10n from "lib/helpers/l10n";
import { SliderField } from "ui/form/SliderField";
import { CheckboxField } from "ui/form/CheckboxField";
import { Label } from "ui/form/Label";
import { Input } from "ui/form/Input";
import clamp from "lib/helpers/clamp";
import { VibratoWaveformPreview } from "./VibratoWaveformPreview";
import styled from "styled-components";
import { SidebarHeader } from "ui/form/SidebarHeader";
import { renderNote } from "./helpers";

type EffectCodeOption = {
  value: number | null;
  label: string;
  info?: string;
};

type EffectCodeOptionGroup = {
  label: string;
  options: EffectCodeOption[];
};

const effectCodeOptions = [
  {
    label: "",
    options: [
      {
        value: null,
        label: l10n("FIELD_NO_EFFECT"),
      },
    ],
  },
  {
    label: "Pitch",
    options: [
      {
        value: 0,
        label: "Arpeggio",
        info: "0xy",
      },
      {
        value: 1,
        label: "Portamento Up",
        info: "1xx",
      },
      {
        value: 2,
        label: "Portamento Down",
        info: "2xx",
      },
      {
        value: 3,
        label: "Tone Portamento",
        info: "3xx",
      },
      {
        value: 4,
        label: "Vibrato",
        info: "4xy",
      },
    ],
  },
  {
    label: "Volume",
    options: [
      {
        value: 5,
        label: "Set Master Volume",
        info: "5xx",
      },
      {
        value: 10,
        label: "Volume Slide",
        info: "Axy",
      },
      {
        value: 12,
        label: "Set Volume",
        info: "Cev",
      },
      {
        value: 8,
        label: "Set Panning",
        info: "8xx",
      },
    ],
  },
  {
    label: "Note",
    options: [
      {
        value: 7,
        label: "Note Delay",
        info: "7xx",
      },
      {
        value: 14,
        label: "Note Cut",
        info: "Exx",
      },
    ],
  },
  {
    label: "Position",
    options: [
      {
        value: 11,
        label: "Position Jump",
        info: "Bxx",
      },
      {
        value: 13,
        label: "Pattern Break",
        info: "Dxx",
      },
    ],
  },
  {
    label: "Other",
    options: [
      {
        value: 6,
        label: "Call Routine",
        info: "6xx",
      },
      {
        value: 9,
        label: "Set Duty Cycle",
        info: "9xx",
      },
      {
        value: 15,
        label: "Set Speed",
        info: "Fxx",
      },
    ],
  },
] as EffectCodeOptionGroup[];

const dutyOptions = [
  {
    value: 0x00,
    label: "12.5%",
  },
  {
    value: 0x40,
    label: "25%",
  },
  {
    value: 0x80,
    label: "50%",
  },
  {
    value: 0xc0,
    label: "75%",
  },
];

const routineOptions = [
  {
    value: 0,
    label: "Routine 0",
  },
  {
    value: 1,
    label: "Routine 1",
  },
  {
    value: 2,
    label: "Routine 2",
  },
  {
    value: 3,
    label: "Routine 3",
  },
];

const waveformOptions = [
  {
    value: 0x0,
    label: "0000000000000000000000000",
  },
  {
    value: 0x1,
    label: "0101010101010101010101010",
  },
  {
    value: 0x2,
    label: "0011001100110011001100110",
  },
  {
    value: 0x3,
    label: "0111011101110111011101110",
  },
  {
    value: 0x4,
    label: "0000111100001111000011110",
  },
  {
    value: 0x5,
    label: "0101111101011111010111110",
  },
  {
    value: 0x6,
    label: "0011111100111111001111110",
  },
  {
    value: 0x7,
    label: "0111111101111111011111110",
  },
  {
    value: 0x8,
    label: "0000000011111111000000001",
  },
  {
    value: 0x9,
    label: "0101010111111111010101011",
  },
  {
    value: 0xa,
    label: "0011001111111111001100111",
  },
  {
    value: 0xb,
    label: "0111011111111111011101111",
  },
  {
    value: 0xc,
    label: "0000111111111111000011111",
  },
  {
    value: 0xd,
    label: "0101111111111111010111111",
  },
  {
    value: 0xe,
    label: "0011111111111111001111111",
  },
  {
    value: 0xf,
    label: "0111111111111111011111111",
  },
];

const noteOptions = Array(72)
  .fill("")
  .map((_, i) => {
    return {
      value: i,
      label: renderNote(i),
    };
  });

const VibrateWaveFormOptionWrapper = styled.div`
  display: flex;
  white-space: nowrap;
  align-items: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface PatternCellEditorProps {
  id: number;
  patternId: number;
  pattern: PatternCell[];
}

export const PatternCellEditor = ({
  id,
  patternId,
  pattern,
}: PatternCellEditorProps) => {
  const dispatch = useDispatch();

  const selectedChannel = useSelector(
    (state: RootState) => state.tracker.selectedChannel
  );

  const [selectedEffectCode, setSelectedEffectCode] =
    useState<EffectCodeOption>();
  useEffect(() => {
    let option: EffectCodeOption | null = null;
    effectCodeOptions.find((optGroup) => {
      const foundOption = optGroup.options.find(
        (opt) => opt.value === pattern[selectedChannel].effectcode
      );
      if (foundOption) {
        option = foundOption;
        return true;
      }
      return false;
    });
    setSelectedEffectCode(option || effectCodeOptions[0]?.options[0]);
  }, [pattern, selectedChannel, selectedEffectCode]);

  const renderEffectEditor = (
    note: number | null,
    effectcode: number | null,
    effectparam: number | null
  ) => {
    const effectparams = {
      x: (effectparam || 0) >> 4,
      y: (effectparam || 0) & 0xf,
    };

    const onChangeParamField = (field: "x" | "y") => (value: number) => {
      let effectparam = 0;
      if (field === "x") {
        effectparam = (value << 4) | effectparams["y"];
      }
      if (field === "y") {
        effectparam = (effectparams["x"] << 4) | value;
      }
      onChangeField("effectparam")(effectparam || 0);
    };

    switch (effectcode) {
      case 0: // Arpeggio
        return (
          <>
            <FormRow>
              <SliderField
                name="effectparamsX"
                value={effectparams["x"]}
                min={0}
                max={15}
                onChange={(value) => {
                  onChangeParamField("x")(value || 0);
                }}
              />
            </FormRow>
            <FormRow>
              <SliderField
                name="effectparamsY"
                value={effectparams["y"]}
                min={0}
                max={15}
                onChange={(value) => {
                  onChangeParamField("y")(value || 0);
                }}
              />
            </FormRow>
          </>
        );
      case 1: // Portamento Up
      case 2: // Portamento Down
      case 3: // Tone Portamento
        const selectedNoteOption = noteOptions.find((i) => i.value === note);

        return (
          <>
            <FormRow>
              <FormField name="note">
                <Select
                  name="note"
                  value={selectedNoteOption}
                  options={noteOptions}
                  onChange={onChangeFieldSelect("note")}
                />
              </FormField>
            </FormRow>
            <FormRow>
              <SliderField
                name="effectparam"
                value={effectparam || 0}
                min={0}
                max={255}
                onChange={(value) => {
                  onChangeField("effectparam")(value || 0);
                }}
              />
            </FormRow>
          </>
        );
      case 5: // Set Master Volume
        return (
          <>
            <FormRow>
              <SliderField
                name="effectparamsX"
                value={effectparams["x"]}
                label={l10n("FIELD_VOLUME_LEFT")}
                min={0}
                max={15}
                onChange={(value) => {
                  onChangeParamField("x")(value || 0);
                }}
              />
            </FormRow>
            <FormRow>
              <SliderField
                name="effectparamsY"
                value={effectparams["y"]}
                label={l10n("FIELD_VOLUME_RIGHT")}
                min={0}
                max={15}
                onChange={(value) => {
                  onChangeParamField("y")(value || 0);
                }}
              />
            </FormRow>
          </>
        );
      case 4: // Vibrato
        const selectedWaveform = waveformOptions.find(
          (i) => i.value === effectparams["x"]
        );

        return (
          <>
            <FormRow>
              <SliderField
                name="effectparamsY"
                value={effectparams["y"]}
                label={l10n("FIELD_DEPTH")}
                min={0}
                max={15}
                onChange={(value) => {
                  onChangeParamField("y")(value || 0);
                }}
              />
            </FormRow>
            <FormRow>
              <FormField name="effectparam" label={l10n("FIELD_WAVEFORM")}>
                <Select
                  name="effectparam"
                  value={selectedWaveform}
                  options={waveformOptions}
                  onChange={(e: { value: number; label: string }) => {
                    onChangeParamField("x")(e.value || 0);
                  }}
                  formatOptionLabel={(option: Option) => {
                    return (
                      <VibrateWaveFormOptionWrapper>
                        <span style={{ paddingRight: 8 }}>{option.value}:</span>
                        <VibratoWaveformPreview waveform={option.label || ""} />
                      </VibrateWaveFormOptionWrapper>
                    );
                  }}
                />
              </FormField>
            </FormRow>
          </>
        );
      case 6: // Call Routine
        const selectedRoutine = routineOptions.find(
          (i) => i.value === (effectparams["y"] || 0) % 4
        );
        return (
          <FormRow>
            <FormField name="effectparam" label={l10n("FIELD_ROUTINE")}>
              <Select
                name="effectparam"
                value={selectedRoutine}
                options={routineOptions}
                onChange={(e: { value: number; label: string }) => {
                  onChangeParamField("y")(e.value || 0);
                }}
              />
            </FormField>
          </FormRow>
        );
      case 7: // Note Delay
        return (
          <FormRow>
            <SliderField
              name="effectparam"
              value={effectparam || 0}
              min={0}
              max={255}
              onChange={(value) => {
                onChangeField("effectparam")(value || 0);
              }}
            />
          </FormRow>
        );
      case 8: // Set Panning
        const renderPanningFieldCheckbox = (
          param: "x" | "y",
          label: string,
          name: string,
          value: 0x1 | 0x2 | 0x4 | 0x8
        ) => {
          return (
            <CheckboxField
              label={l10n(label)}
              name={name}
              checked={(effectparams[param] & value) === value}
              onChange={(e) => {
                const checked = e.target.checked;
                if (!checked) {
                  onChangeParamField(param)(effectparams[param] & ~value);
                } else {
                  onChangeParamField(param)(effectparams[param] | value);
                }
              }}
            />
          );
        };
        return (
          <>
            <FormRow>
              <Label style={{ width: "100%" }}>Left</Label>
              <Label style={{ width: "100%" }}>Right</Label>
            </FormRow>
            <FormRow>
              {renderPanningFieldCheckbox(
                "y",
                "FIELD_DUTY_1",
                "left_panning_field_duty_1",
                0x1
              )}
              {renderPanningFieldCheckbox(
                "x",
                "FIELD_DUTY_1",
                "right_panning_field_duty_1",
                0x1
              )}
            </FormRow>
            <FormRow>
              {renderPanningFieldCheckbox(
                "y",
                "FIELD_DUTY_2",
                "left_panning_field_duty_2",
                0x2
              )}
              {renderPanningFieldCheckbox(
                "x",
                "FIELD_DUTY_2",
                "right_panning_field_duty_2",
                0x2
              )}
            </FormRow>
            <FormRow>
              {renderPanningFieldCheckbox(
                "y",
                "FIELD_WAVE",
                "left_panning_field_wave",
                0x4
              )}
              {renderPanningFieldCheckbox(
                "x",
                "FIELD_WAVE",
                "right_panning_field_wave",
                0x4
              )}
            </FormRow>
            <FormRow>
              {renderPanningFieldCheckbox(
                "y",
                "FIELD_NOISE",
                "left_panning_field_noise",
                0x8
              )}
              {renderPanningFieldCheckbox(
                "x",
                "FIELD_NOISE",
                "right_panning_field_noise",
                0x8
              )}
            </FormRow>
          </>
        );
      case 9: // Set Duty Cycle
        const selectedDuty = dutyOptions.find((i) => i.value === effectparam);
        return (
          <FormRow>
            <FormField name="effectparam" label={l10n("FIELD_DUTY")}>
              <Select
                name="effectparam"
                value={selectedDuty}
                options={dutyOptions}
                onChange={onChangeFieldSelect("effectparam")}
              />
            </FormField>
          </FormRow>
        );
      case 10: // Volume Slide
        return (
          <>
            <FormRow>
              <SliderField
                name="effectparamsX"
                value={effectparams["x"]}
                min={0}
                max={15}
                onChange={(value) => {
                  onChangeParamField("x")(value || 0);
                }}
              />
            </FormRow>
            <FormRow>
              <SliderField
                name="effectparamsY"
                value={effectparams["y"]}
                min={0}
                max={15}
                onChange={(value) => {
                  onChangeParamField("y")(value || 0);
                }}
              />
            </FormRow>
          </>
        );
      case 11: // Position Jump
        return (
          <FormRow>
            <Input
              type="number"
              min={0}
              max={63}
              placeholder="0"
              value={effectparam || 0}
              onChange={(e) => {
                onChangeField("effectparam")(
                  clamp(e.currentTarget.valueAsNumber, 0, 63)
                );
              }}
            ></Input>
          </FormRow>
        );
      case 12: // Set Volume
        return (
          <FormRow>
            <SliderField
              name="effectparam"
              label={l10n("FIELD_VOLUME")}
              value={effectparam || 7}
              min={0}
              max={15}
              onChange={(value) => {
                onChangeField("effectparam")(value || 0);
              }}
            />
          </FormRow>
        );
      case 13: // Pattern Break
        return (
          <FormRow>
            <Input
              type="number"
              min={0}
              max={63}
              placeholder="0"
              value={effectparam || 0}
              onChange={(e) => {
                onChangeField("effectparam")(
                  clamp(e.currentTarget.valueAsNumber, 0, 63)
                );
              }}
            ></Input>
          </FormRow>
        );
      case 14: // Note Cut
        return (
          <FormRow>
            <SliderField
              name="effectparam"
              label={l10n("FIELD_NOTE_CUT")}
              value={effectparam || 0}
              min={0}
              max={255}
              onChange={(value) => {
                onChangeField("effectparam")(value || 0);
              }}
            />
          </FormRow>
        );
      case 15: // Set Speed
        return (
          <FormRow>
            <SliderField
              name="effectparam"
              label={l10n("FIELD_SPEED")}
              value={effectparam || 0}
              min={0}
              max={255}
              onChange={(value) => {
                onChangeField("effectparam")(value || 0);
              }}
            />
          </FormRow>
        );
    }
  };

  const onChangeField =
    <T extends keyof PatternCell>(key: T) =>
    (editValue: PatternCell[T]) => {
      dispatch(
        trackerDocumentActions.editPatternCell({
          patternId: patternId,
          cell: [id, selectedChannel],
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeFieldSelect =
    <T extends keyof PatternCell>(key: T) =>
    (e: { value: number; label: string }) => {
      const editValue = e.value;

      const newChanges = {} as Partial<PatternCell>;

      newChanges[key] = editValue;
      if (key === "effectcode" && editValue === null) {
        newChanges["effectparam"] = null;
      }

      dispatch(
        trackerDocumentActions.editPatternCell({
          patternId: patternId,
          cell: [id, selectedChannel],
          changes: newChanges,
        })
      );
    };

  const { note, effectcode, effectparam } = pattern[selectedChannel];

  return (
    <>
      <FormDivider />
      <FormHeader>
        <SidebarHeader>{l10n("FIELD_NOTE_EFFECT")}</SidebarHeader>
      </FormHeader>{" "}
      <FormRow>
        <FormField name="effect_code" label={l10n("FIELD_EFFECT")}>
          <Select
            name="effect_code"
            value={selectedEffectCode}
            options={effectCodeOptions}
            onChange={onChangeFieldSelect("effectcode")}
            formatOptionLabel={(
              option: {
                value: number;
                label: string;
                info: string;
              },
              { context }: { context: "menu" | "value" }
            ) => {
              return (
                <OptionLabelWithInfo
                  info={context === "menu" ? option.info : ""}
                >
                  {option.label}
                </OptionLabelWithInfo>
              );
            }}
          />
        </FormField>
      </FormRow>
      {renderEffectEditor(note, effectcode, effectparam)}
    </>
  );
};
