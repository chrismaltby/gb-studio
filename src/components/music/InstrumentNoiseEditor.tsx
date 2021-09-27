import React from "react";
import { useDispatch } from "react-redux";
import castEventValue from "lib/helpers/castEventValue";
import l10n from "lib/helpers/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { NoiseInstrument } from "store/features/trackerDocument/trackerDocumentTypes";
import { CheckboxField } from "ui/form/CheckboxField";
import { FormDivider, FormRow } from "ui/form/FormLayout";
import { SliderField } from "ui/form/SliderField";
import { InstrumentLengthForm } from "./InstrumentLengthForm";
import { InstrumentVolumeEditor } from "./InstrumentVolumeEditor";
import { NoiseMacroEditorForm } from "./NoiseMacroEditorForm";
import { ipcRenderer } from "electron";
import { Button } from "ui/buttons/Button";

interface InstrumentNoiseEditorProps {
  id: string;
  instrument?: NoiseInstrument;
}

export const InstrumentNoiseEditor = ({
  instrument,
}: InstrumentNoiseEditorProps) => {
  const dispatch = useDispatch();

  if (!instrument) return <></>;

  const onChangeField =
    <T extends keyof NoiseInstrument>(key: T) =>
    (editValue: NoiseInstrument[T]) => {
      dispatch(
        trackerDocumentActions.editNoiseInstrument({
          instrumentId: instrument.index,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onTestInstrument = () => {
    ipcRenderer.send("music-data-send", {
      action: "preview",
      note: 24, // C_5
      type: "noise",
      instrument: instrument,
      square2: false,
    });
  };

  return (
    <>
      <InstrumentLengthForm
        value={instrument.length}
        onChange={onChangeField("length")}
      />

      <FormDivider />

      <InstrumentVolumeEditor
        initial_volume={instrument.initial_volume}
        volume_sweep_change={instrument.volume_sweep_change}
        length={instrument.length}
        onChange={onChangeField}
      />

      <FormDivider />

      <FormRow>
        <SliderField
          name="shift_clock_mask"
          label={l10n("FIELD_SHIFT_CLOCK_MASK")}
          value={instrument.shift_clock_mask || 0}
          min={0}
          max={15}
          onChange={(value) => {
            onChangeField("shift_clock_mask")(value || 0);
          }}
        />
      </FormRow>

      <FormRow>
        <SliderField
          name="dividing_ratio"
          label={l10n("FIELD_DIVIDING_RATIO")}
          value={instrument.dividing_ratio || 0}
          min={0}
          max={7}
          onChange={(value) => {
            onChangeField("dividing_ratio")(value || 0);
          }}
        />
      </FormRow>

      <FormDivider />

      <FormRow>
        <CheckboxField
          name="length"
          label={l10n("FIELD_BIT_COUNT")}
          checked={instrument.bit_count === 7}
          onChange={(e) => {
            const v = castEventValue(e);
            const value = v ? 7 : 15;
            onChangeField("bit_count")(value);
          }}
        />
      </FormRow>

      <NoiseMacroEditorForm
        macros={instrument.noise_macro}
        onChange={onChangeField("noise_macro")}
      />

      <FormDivider />

      <FormRow>
        <Button onClick={onTestInstrument}>
          {l10n("FIELD_TEST_INSTRUMENT")}
        </Button>
      </FormRow>
    </>
  );
};
