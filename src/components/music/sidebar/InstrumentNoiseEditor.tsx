import React, { useEffect, useRef } from "react";
import { castEventToBool } from "renderer/lib/helpers/castEventValue";
import l10n from "shared/lib/lang/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { SubPatternCell, NoiseInstrument } from "shared/lib/uge/types";
import { CheckboxField } from "ui/form/CheckboxField";
import { FormDivider, FormField, FormRow } from "ui/form/layout/FormLayout";
import { InstrumentLengthForm } from "./InstrumentLengthForm";
import { InstrumentVolumeEditor } from "./InstrumentVolumeEditor";
import { NoiseMacroEditorForm } from "./NoiseMacroEditorForm";
import { Button } from "ui/buttons/Button";
import { cloneDeep, throttle } from "lodash";
import { Alert, AlertItem } from "ui/alerts/Alert";
import API from "renderer/lib/api";
import { useAppDispatch } from "store/hooks";
import { ButtonGroup } from "ui/buttons/ButtonGroup";
import { testNotes } from "./helpers";
import { OCTAVE_SIZE } from "consts";

interface InstrumentNoiseEditorProps {
  id: string;
  instrument?: NoiseInstrument;
}

export const InstrumentNoiseEditor = ({
  instrument,
}: InstrumentNoiseEditorProps) => {
  const dispatch = useAppDispatch();

  const throttledTestInstrument = useRef(
    throttle(
      (instrument: NoiseInstrument) => {
        API.music.sendToMusicWindow({
          action: "preview",
          note: OCTAVE_SIZE * 4, // C_7
          type: "noise",
          instrument: instrument,
          square2: false,
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
    const instrumentKey = JSON.stringify(instrument);

    if (
      instrument &&
      hasMounted.current &&
      instrumentKey !== lastAutoPreview.current
    ) {
      throttledTestInstrument(instrument);
    }

    lastAutoPreview.current = instrumentKey;
    hasMounted.current = true;
  }, [instrument, throttledTestInstrument]);

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
        }),
      );
    };

  const onChangeSubpattern = (macros: number[]) => {
    const newSubPattern = cloneDeep(instrument.subpattern);
    macros.forEach((value, i) => {
      newSubPattern[i].note = value + 36;
    });

    dispatch(
      trackerDocumentActions.editSubPattern({
        instrumentId: instrument.index,
        instrumentType: "noise",
        subpattern: newSubPattern,
      }),
    );
  };

  const onTestInstrument = (note: number) => () => {
    API.music.sendToMusicWindow({
      action: "preview",
      note,
      type: "noise",
      instrument: instrument,
      square2: false,
    });
  };

  const noiseMacros = !instrument.subpattern_enabled
    ? []
    : instrument.subpattern
        // .slice(0, 6)
        .map((subpatternCell: SubPatternCell) =>
          subpatternCell && subpatternCell.note ? subpatternCell.note - 36 : 0,
        );

  return (
    <>
      <InstrumentLengthForm
        value={instrument.length}
        onChange={onChangeField("length")}
      />

      <FormDivider />

      <InstrumentVolumeEditor
        initialVolume={instrument.initial_volume}
        volumeSweepChange={instrument.volume_sweep_change}
        length={instrument.length}
        onChange={onChangeField}
      />

      <FormDivider />

      <FormRow>
        <CheckboxField
          name="bit_count"
          label={l10n("FIELD_BIT_COUNT")}
          checked={instrument.bit_count === 7}
          onChange={(e) => {
            const v = castEventToBool(e);
            const value = v ? 7 : 15;
            onChangeField("bit_count")(value);
          }}
        />
      </FormRow>

      {/* Disable the noise macro preview for now. In the future it should edit the subpattern visually  */}
      {false ? ( // {instrument.noise_macro ? (
        <>
          <NoiseMacroEditorForm
            macros={noiseMacros}
            onChange={onChangeSubpattern}
          />
        </>
      ) : (
        ""
      )}

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
