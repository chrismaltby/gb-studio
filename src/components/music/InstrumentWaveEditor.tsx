import React from "react";
import { useDispatch } from "react-redux";
import l10n from "lib/helpers/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { WaveInstrument } from "store/features/trackerDocument/trackerDocumentTypes";
import { FormDivider, FormField, FormRow } from "ui/form/FormLayout";
import { Select } from "ui/form/Select";
import { InstrumentLengthForm } from "./InstrumentLengthForm";
import { WaveEditorForm } from "./WaveEditorForm";
import { ipcRenderer } from "electron";
import { Button } from "ui/buttons/Button";

const volumeOptions = [
  {
    value: "0",
    label: "Mute",
  },
  {
    value: "1",
    label: "100%",
  },
  {
    value: "2",
    label: "50%",
  },
  {
    value: "3",
    label: "25%",
  },
];

interface InstrumentWaveEditorProps {
  id: string;
  instrument?: WaveInstrument;
  waveForms?: Uint8Array[];
}

export const InstrumentWaveEditor = ({
  instrument,
  waveForms,
}: InstrumentWaveEditorProps) => {
  const dispatch = useDispatch();

  if (!instrument) return <></>;

  const selectedVolume = volumeOptions.find(
    (i) => parseInt(i.value, 10) === instrument.volume
  );

  const onChangeField =
    <T extends keyof WaveInstrument>(key: T) =>
    (editValue: WaveInstrument[T]) => {
      dispatch(
        trackerDocumentActions.editWaveInstrument({
          instrumentId: instrument.index,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeFieldSelect =
    <T extends keyof WaveInstrument>(key: T) =>
    (e: { value: string; label: string }) => {
      const editValue = e.value;
      dispatch(
        trackerDocumentActions.editWaveInstrument({
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
      type: "wave",
      instrument: instrument,
      square2: false,
      waveForms: waveForms,
    });
  };

  return (
    <>
      <InstrumentLengthForm
        value={instrument.length}
        onChange={onChangeField("length")}
        min={1}
        max={256}
      />

      <FormDivider />

      <FormRow>
        <FormField name="volume" label={l10n("FIELD_VOLUME")}>
          <Select
            name="volume"
            value={selectedVolume}
            options={volumeOptions}
            onChange={onChangeFieldSelect("volume")}
          />
        </FormField>
      </FormRow>

      <WaveEditorForm
        waveId={instrument.wave_index}
        onChange={onChangeFieldSelect("wave_index")}
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
