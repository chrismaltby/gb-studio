import React, { useRef, useEffect } from "react";
import l10n from "shared/lib/lang/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { WaveInstrument } from "shared/lib/uge/types";
import { FormDivider, FormField, FormRow } from "ui/form/layout/FormLayout";
import { Option, Select } from "ui/form/Select";
import { InstrumentLengthForm } from "./InstrumentLengthForm";
import { WaveEditorForm } from "./WaveEditorForm";
import { Button } from "ui/buttons/Button";
import { Alert, AlertItem } from "ui/alerts/Alert";
import API from "renderer/lib/api";
import { useAppDispatch } from "store/hooks";
import { SingleValue } from "react-select";
import { ButtonGroup } from "ui/buttons/ButtonGroup";
import { testNotes } from "./helpers";
import throttle from "lodash/throttle";
import { OCTAVE_SIZE } from "consts";

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

  const throttledTestInstrument = useRef(
    throttle(
      (instrument: WaveInstrument, waveForms?: Uint8Array[]) => {
        API.music.sendToMusicWindow({
          action: "preview",
          note: OCTAVE_SIZE * 2, // C5
          type: "wave",
          instrument: instrument,
          square2: false,
          waveForms: waveForms,
        });
      },
      250,
      { leading: true, trailing: true },
    ),
  ).current;

  useEffect(() => {
    return () => {
      throttledTestInstrument.cancel();
    };
  }, [throttledTestInstrument]);

  const lastAutoPreview = useRef("");
  const hasMounted = useRef(false);

  useEffect(() => {
    const instrumentKey = JSON.stringify({ instrument, waveForms });

    if (
      instrument &&
      hasMounted.current &&
      instrumentKey !== lastAutoPreview.current
    ) {
      throttledTestInstrument(instrument, waveForms);
    }

    lastAutoPreview.current = instrumentKey;
    hasMounted.current = true;
  }, [instrument, throttledTestInstrument, waveForms]);

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

  const onTestInstrument = (note: number) => () => {
    API.music.sendToMusicWindow({
      action: "preview",
      note,
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
        <FormField
          name="test_instrument_C5"
          label={l10n("FIELD_TEST_INSTRUMENT")}
        >
          <ButtonGroup>
            {testNotes.map(({ label, value }) => (
              <Button
                key={`test_instrument_${label}`}
                id={`test_instrument_${label}`}
                onClick={onTestInstrument(value)}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </FormField>
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
