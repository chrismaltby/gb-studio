import React from "react";
import l10n from "shared/lib/lang/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { WaveInstrument } from "store/features/trackerDocument/trackerDocumentTypes";
import { FormDivider, FormField, FormRow } from "ui/form/layout/FormLayout";
import { Option, Select } from "ui/form/Select";
import { InstrumentLengthForm } from "./InstrumentLengthForm";
import { WaveEditorForm } from "./WaveEditorForm";
import { Button } from "ui/buttons/Button";
import { Alert, AlertItem } from "ui/alerts/Alert";
import API from "renderer/lib/api";
import { useAppDispatch } from "store/hooks";
import { SingleValue } from "react-select";

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
  const dispatch = useAppDispatch();

  if (!instrument) return <></>;

  const selectedVolume = volumeOptions.find(
    (i) => parseInt(i.value, 10) === instrument.volume,
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
        }),
      );
    };

  const onChangeFieldSelect =
    <T extends keyof WaveInstrument>(key: T) =>
    (e: { value: number | string; label: string }) => {
      const editValue = e.value;
      dispatch(
        trackerDocumentActions.editWaveInstrument({
          instrumentId: instrument.index,
          changes: {
            [key]: editValue,
          },
        }),
      );
    };

  const onTestInstrument = () => {
    API.music.sendToMusicWindow({
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
            onChange={(e: SingleValue<Option>) =>
              e && onChangeFieldSelect("volume")(e)
            }
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
      {instrument.subpattern_enabled && (
        <FormRow>
          <Alert variant="info">
            <AlertItem>{l10n("MESSAGE_NOT_PREVIEW_SUBPATTERN")}</AlertItem>
          </Alert>
        </FormRow>
      )}
    </>
  );
};
