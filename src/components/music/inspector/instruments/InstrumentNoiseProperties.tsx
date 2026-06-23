import React, { useCallback, useMemo } from "react";
import { castEventToBool } from "renderer/lib/helpers/castEventValue";
import l10n from "shared/lib/lang/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { NoiseInstrument } from "shared/lib/uge/types";
import { CheckboxField } from "ui/form/CheckboxField";
import { FormDivider, FormRow } from "ui/form/layout/FormLayout";
import { useAppDispatch } from "store/hooks";
import { InstrumentEnvelopeProperties } from "./InstrumentEnvelopeProperties";
import { InstrumentEnvelopePreview } from "./InstrumentEnvelopePreview";

interface InstrumentNoisePropertiesProps {
  id: string;
  instrument?: NoiseInstrument;
}

export const InstrumentNoiseProperties = ({
  instrument,
}: InstrumentNoisePropertiesProps) => {
  const dispatch = useAppDispatch();

  const instrumentId = instrument?.index;

  const onChangeField = useCallback(
    <T extends keyof NoiseInstrument>(key: T) =>
      (editValue: NoiseInstrument[T]) => {
        if (instrumentId === undefined) {
          return;
        }
        dispatch(
          trackerDocumentActions.editNoiseInstrument({
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
        <CheckboxField
          name="bitCount"
          label={l10n("FIELD_BIT_COUNT")}
          checked={instrument.bitCount === 7}
          onChange={(e) => {
            const v = castEventToBool(e);
            const value = v ? 7 : 15;
            onChangeField("bitCount")(value);
          }}
        />
      </FormRow>
    </>
  );
};
