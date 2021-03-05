import React from "react";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";
import { WaveInstrument } from "../../lib/helpers/uge/song/WaveInstrument";
import { Checkbox } from "../ui/form/Checkbox";
import { CheckboxField } from "../ui/form/CheckboxField";
import { FormDivider, FormField, FormRow } from "../ui/form/FormLayout";
import { Select } from "../ui/form/Select";
import { SelectField } from "../ui/form/SelectField";
import { Slider } from "../ui/form/Slider";
import { SliderField } from "../ui/form/SliderField";

const volumeOptions = [
  {
    value: "0",
    label: "Mute"
  },
  {
    value: "1",
    label: "100%"
  },
  {
    value: "2",
    label: "50%"
  },
  {
    value: "3",
    label: "25%"
  }
];

interface InstrumentWaveEditorProps {
  id: string;
  instrument?: WaveInstrument
}

export const InstrumentWaveEditor = ({
  instrument
}: InstrumentWaveEditorProps) => {

  if (!instrument) return <>EMPTY</>;

  const selectedVolume = volumeOptions.find((i) => parseInt(i.value, 10) === instrument.volume);

  const onChangeFieldInput = <T extends keyof WaveInstrument>(key: T) => (
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

      <FormDivider/>

      <FormRow>
        <FormField
          name="volume"
          label={l10n("FIELD_VOLUME")}
        >
          <Select
            name="volume"
            value={selectedVolume}
            options={volumeOptions}
            onChange={onChangeFieldInput("volume")}
          />
        </FormField>
      </FormRow>

    </>
  );
}