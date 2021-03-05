import React from "react";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";
import { NoiseInstrument } from "../../lib/helpers/uge/song/NoiseInstrument";
import { Checkbox } from "../ui/form/Checkbox";
import { CheckboxField } from "../ui/form/CheckboxField";
import { FormDivider, FormField, FormRow } from "../ui/form/FormLayout";
import { Label } from "../ui/form/Label";
import { Select } from "../ui/form/Select";
import { Slider } from "../ui/form/Slider";
import { SliderField } from "../ui/form/SliderField";

interface InstrumentNoiseEditorProps {
  id: string;
  instrument?: NoiseInstrument
}

export const InstrumentNoiseEditor = ({
  instrument
}: InstrumentNoiseEditorProps) => {

  if (!instrument) return <>EMPTY</>;

  const onChangeFieldInput = <T extends keyof NoiseInstrument>(key: T) => (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    // dispatch(
    //   entitiesActions.editSpriteSheet({
    //     spriteSheetId: id,
    //     changes: {
    //       [key]: editValue,
    //     },
    //   })
    // );
  };

  return (
    <>
      <FormRow>
        <CheckboxField
          label={l10n("FIELD_LENGTH")}
          name="length"
          checked={!!instrument.length}
          onChange={onChangeFieldInput("length")}
        />
      </FormRow>
      <FormRow>
        <SliderField
          name="length"
          value={instrument.length || 0}
          min={0}
          max={63}
        // onChange={onChangeFieldInput("length")}
        />
      </FormRow>

      <FormDivider />

      <FormRow>
        <SliderField
          name="initial_volume"
          label={l10n("FIELD_INITIAL_VOLUME")}
          value={instrument.initial_volume || 0}
          min={0}
          max={15}
        // onChange={onChangeFieldInput("initial_volume")}
        />
      </FormRow>

      <FormRow>
        <SliderField
          name="volume_sweep_change"
          label={l10n("FIELD_VOLUME_SWEEP_CHANGE")}
          value={instrument.volume_sweep_change || 0}
          min={-7}
          max={7}
        // onChange={onChangeFieldInput("volume_sweep_change")}
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
        // onChange={onChangeFieldInput("shift_clock_mask")}
        />
      </FormRow>

      <FormRow>
        <SliderField
          name="dividing_ratio"
          label={l10n("FIELD_DIVIDING_RATIO")}
          value={instrument.dividing_ratio || 0}
          min={0}
          max={7}
        // onChange={onChangeFieldInput("dividing_ratio")}
        />
      </FormRow>
      <FormRow>
        <CheckboxField
          name="length"
          label={l10n("FIELD_BIT_COUNT")}
          checked={!!instrument.bit_count}
          onChange={onChangeFieldInput("bit_count")}
        />
      </FormRow>

    </>
  );
}