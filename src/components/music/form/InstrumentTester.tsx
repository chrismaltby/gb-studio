import React, { useCallback, useEffect, useRef } from "react";
import {
  playDutyNotePreview,
  playNoiseNotePreview,
  playWaveNotePreview,
} from "components/music/helpers/notePreview";
import { testNotes } from "components/music/inspector/helpers";
import { NOTE_C5 } from "consts";
import isEqual from "lodash/isEqual";
import debounce from "lodash/debounce";
import omit from "lodash/omit";
import l10n from "shared/lib/lang/l10n";
import {
  DutyInstrument,
  NoiseInstrument,
  WaveInstrument,
} from "shared/lib/uge/types";
import { useAppSelector } from "store/hooks";
import { Button } from "ui/buttons/Button";
import { ButtonGroup } from "ui/buttons/ButtonGroup";
import { FormField, FormRow } from "ui/form/layout/FormLayout";
import { InstrumentType } from "shared/lib/music/types";

interface InstrumentTesterProps {
  instrumentId: number;
  instrumentType: InstrumentType;
}

const genKey = (instrumentId: number, instrumentType: InstrumentType): string =>
  `${instrumentId}:${instrumentType}`;

type CurrentInstrument =
  | { type: "duty"; instrument?: DutyInstrument }
  | { type: "wave"; instrument?: WaveInstrument; waveForm?: Uint8Array }
  | { type: "noise"; instrument?: NoiseInstrument };

const getCurrentInstrument = (
  instrumentType: InstrumentType,
  dutyInstrument: DutyInstrument | undefined,
  waveInstrument: WaveInstrument | undefined,
  noiseInstrument: NoiseInstrument | undefined,
  waveForm: Uint8Array | undefined,
): CurrentInstrument => {
  if (instrumentType === "duty") {
    return { type: "duty", instrument: dutyInstrument };
  }
  if (instrumentType === "wave") {
    return { type: "wave", instrument: waveInstrument, waveForm };
  }
  return { type: "noise", instrument: noiseInstrument };
};

export const InstrumentTester = ({
  instrumentId,
  instrumentType,
}: InstrumentTesterProps) => {
  const selectedChannelId = useAppSelector(
    (state) => state.tracker.selectedChannel,
  );

  const dutyInstrument = useAppSelector(
    (state) =>
      state.trackerDocument.present.song?.dutyInstruments[instrumentId],
  );
  const waveInstrument = useAppSelector(
    (state) =>
      state.trackerDocument.present.song?.waveInstruments[instrumentId],
  );
  const noiseInstrument = useAppSelector(
    (state) =>
      state.trackerDocument.present.song?.noiseInstruments[instrumentId],
  );
  const waveForm = useAppSelector(
    (state) =>
      state.trackerDocument.present.song?.waves[waveInstrument?.waveIndex ?? 0],
  );

  const selectedChannelIdRef = useRef(selectedChannelId);
  const keyRef = useRef(genKey(instrumentId, instrumentType));
  const currentInstrumentRef = useRef<CurrentInstrument>(
    getCurrentInstrument(
      instrumentType,
      dutyInstrument,
      waveInstrument,
      noiseInstrument,
      waveForm,
    ),
  );

  useEffect(() => {
    selectedChannelIdRef.current = selectedChannelId;
  }, [selectedChannelId]);

  const playPreview = useCallback((note: number) => {
    const current = currentInstrumentRef.current;

    if (current.type === "duty" && current.instrument) {
      playDutyNotePreview(
        note,
        current.instrument,
        selectedChannelIdRef.current === 1 ? 1 : 0,
        0,
        0,
      );
      return;
    }

    if (current.type === "wave" && current.instrument && current.waveForm) {
      playWaveNotePreview(note, current.instrument, current.waveForm, 0, 0);
      return;
    }

    if (current.type === "noise" && current.instrument) {
      playNoiseNotePreview(note, current.instrument, 0, 0);
    }
  }, []);

  const debouncedTestInstrumentRef = useRef(
    debounce(
      () => {
        playPreview(NOTE_C5);
      },
      100,
      { leading: false, trailing: true },
    ),
  );

  useEffect(() => {
    const prevInstrument = currentInstrumentRef.current;

    currentInstrumentRef.current = getCurrentInstrument(
      instrumentType,
      dutyInstrument,
      waveInstrument,
      noiseInstrument,
      waveForm,
    );

    const newKey = genKey(instrumentId, instrumentType);

    if (keyRef.current === newKey) {
      const ignoreFields = ["name"];
      const before = {
        ...prevInstrument,
        instrument: omit(prevInstrument.instrument, ignoreFields),
      };
      const after = {
        ...currentInstrumentRef.current,
        instrument: omit(currentInstrumentRef.current.instrument, ignoreFields),
      };
      if (!isEqual(before, after)) {
        debouncedTestInstrumentRef.current();
      }
    }

    keyRef.current = newKey;
  }, [
    dutyInstrument,
    instrumentId,
    instrumentType,
    noiseInstrument,
    waveForm,
    waveInstrument,
  ]);

  useEffect(() => {
    const debounced = debouncedTestInstrumentRef.current;
    return () => {
      debounced.cancel();
    };
  }, []);

  const onTestInstrument = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const note = Number(e.currentTarget.dataset.note);
      if (!Number.isNaN(note)) {
        playPreview(note);
      }
    },
    [playPreview],
  );

  return (
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
              data-note={value}
              onClick={onTestInstrument}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </FormField>
    </FormRow>
  );
};
