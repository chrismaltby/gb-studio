import React, { useCallback, useEffect, useMemo, useRef } from "react";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { DutyInstrument } from "shared/lib/uge/types";
import { FormDivider, FormField, FormRow } from "ui/form/layout/FormLayout";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Alert, AlertItem } from "ui/alerts/Alert";
import { InstrumentEnvelopeProperties } from "./InstrumentEnvelopeProperties";
import { InstrumentEnvelopePreview } from "./InstrumentEnvelopePreview";
import { Slider } from "ui/form/Slider";
import { FlexGrow } from "ui/spacing/Spacing";
import { DutyCycleSelect } from "components/music/form/DutyCycleSelect";
import { SweepTimeSelect } from "components/music/form/SweepTimeSelect";

interface InstrumentDutyPropertiesProps {
  id: string;
  instrument?: DutyInstrument;
}

export const InstrumentDutyProperties = ({
  instrument,
}: InstrumentDutyPropertiesProps) => {
  const dispatch = useAppDispatch();
  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel,
  );

  const instrumentId = instrument?.index;

  const lastSweepTimeRef = useRef(instrument?.frequencySweepTime || 4);
  useEffect(() => {
    const newSweepTime = instrument?.frequencySweepTime;
    if (typeof newSweepTime === "number" && newSweepTime !== 0) {
      lastSweepTimeRef.current = newSweepTime;
    }
  }, [instrument?.frequencySweepTime]);

  const onChangeField = useCallback(
    <T extends keyof DutyInstrument>(key: T) =>
      (editValue: DutyInstrument[T]) => {
        if (instrumentId === undefined) {
          return;
        }
        dispatch(
          trackerDocumentActions.editDutyInstrument({
            instrumentId,
            changes: {
              [key]: editValue,
            },
          }),
        );
      },
    [dispatch, instrumentId],
  );

  const onChangeEnvelopeLength = useMemo(
    () => onChangeField("length"),
    [onChangeField],
  );

  const onChangeEnvelopeVolume = useMemo(
    () => onChangeField("initialVolume"),
    [onChangeField],
  );

  const onChangeEnvelopeSweep = useMemo(
    () => onChangeField("volumeSweepChange"),
    [onChangeField],
  );

  const onChangeDutyCycle = useMemo(
    () => onChangeField("dutyCycle"),
    [onChangeField],
  );

  const onChangeSweepShift = useCallback(
    (value: number) => {
      if (value === 0) {
        onChangeField("frequencySweepTime")(0);
      } else if (Number(instrument?.frequencySweepTime) === 0) {
        onChangeField("frequencySweepTime")(lastSweepTimeRef.current);
      }
      onChangeField("frequencySweepShift")(value);
    },
    [instrument?.frequencySweepTime, onChangeField],
  );

  const onChangeSweepTime = useCallback(
    (value: number) => {
      if (value !== 0 && Number(instrument?.frequencySweepShift) === 0) {
        onChangeField("frequencySweepShift")(7);
      } else if (value === 0) {
        onChangeField("frequencySweepShift")(0);
      }
      onChangeField("frequencySweepTime")(value);
    },
    [instrument?.frequencySweepShift, onChangeField],
  );

  if (!instrument) {
    return null;
  }

  return (
    <>
      <InstrumentEnvelopeProperties
        volume={instrument.initialVolume}
        sweep={instrument.volumeSweepChange}
        length={instrument.length}
        onChangeVolume={onChangeEnvelopeVolume}
        onChangeSweep={onChangeEnvelopeSweep}
        onChangeLength={onChangeEnvelopeLength}
      />
      <FormRow>
        <InstrumentEnvelopePreview
          volume={instrument.initialVolume}
          sweep={instrument.volumeSweepChange}
          length={instrument.length}
        />
      </FormRow>
      <FormDivider />
      <FormRow>
        <FormField name="dutyCycle" label={l10n("FIELD_DUTY_CYCLE")}>
          <DutyCycleSelect
            name="dutyCycle"
            value={instrument.dutyCycle}
            onChange={onChangeDutyCycle}
            menuPlacement="top"
          />
        </FormField>
      </FormRow>

      <FormDivider />
      <FormRow>
        <FormField name="frequencySweepTime" label={l10n("FIELD_SWEEP_SHIFT")}>
          <Slider
            value={instrument.frequencySweepShift || 0}
            min={-7}
            max={7}
            onChange={onChangeSweepShift}
          />
        </FormField>
        <FormField name="frequencySweepTime" label={l10n("FIELD_SWEEP_TIME")}>
          <SweepTimeSelect
            name={"frequencySweepTime"}
            value={instrument.frequencySweepTime}
            onChange={onChangeSweepTime}
            menuPlacement="top"
          />
        </FormField>
      </FormRow>
      {Number(instrument.frequencySweepTime) !== 0 && selectedChannel === 1 && (
        <FormRow>
          <Alert variant="info">
            <AlertItem>{l10n("MESSAGE_SWEEP_ONLY_DUTY1")}</AlertItem>
          </Alert>
        </FormRow>
      )}
      <FlexGrow />
    </>
  );
};
