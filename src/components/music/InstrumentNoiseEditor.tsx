import React from "react";
import { useDispatch } from "react-redux";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";
import trackerDocumentActions from "../../store/features/trackerDocument/trackerDocumentActions";
import { NoiseInstrument } from "../../store/features/trackerDocument/trackerDocumentTypes";
import { CheckboxField } from "../ui/form/CheckboxField";
import { FormDivider, FormRow } from "../ui/form/FormLayout";
import { SliderField } from "../ui/form/SliderField";
import { InstrumentLengthForm } from "./InstrumentLengthForm";

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

  const onChangeFieldInput =
    <T extends keyof NoiseInstrument>(key: T) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        trackerDocumentActions.editNoiseInstrument({
          instrumentId: instrument.index,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  return (
    <>
      <InstrumentLengthForm
        value={instrument.length}
        onChange={onChangeField("length")}
      />

      <FormDivider />

      <FormRow>
        <SliderField
          name="initial_volume"
          label={l10n("FIELD_INITIAL_VOLUME")}
          value={instrument.initial_volume || 0}
          min={0}
          max={15}
          onChange={(value) => {
            onChangeField("initial_volume")(value || 0);
          }}
        />
      </FormRow>

      <FormRow>
        <SliderField
          name="volume_sweep_change"
          label={l10n("FIELD_VOLUME_SWEEP_CHANGE")}
          value={instrument.volume_sweep_change || 0}
          min={-7}
          max={7}
          onChange={(value) => {
            onChangeField("volume_sweep_change")(value || 0);
          }}
        />
      </FormRow>

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
    </>
  );
};
