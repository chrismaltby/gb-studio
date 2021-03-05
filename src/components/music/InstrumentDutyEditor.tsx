import React from "react";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";
import { DutyInstrument } from "../../lib/helpers/uge/song/DutyInstrument";
import { Checkbox } from "../ui/form/Checkbox";
import { CheckboxField } from "../ui/form/CheckboxField";
import { FormDivider, FormField, FormRow } from "../ui/form/FormLayout";
import { Label } from "../ui/form/Label";
import { Select } from "../ui/form/Select";
import { Slider } from "../ui/form/Slider";
import { SliderField } from "../ui/form/SliderField";

const dutyOptions = [
  {
    value: "0",
    label: "12.5%"
  },
  {
    value: "1",
    label: "25%"
  },
  {
    value: "2",
    label: "50%"
  },
  {
    value: "3",
    label: "75%"
  }
];

const sweepTimeOptions = [
  {
    value: "0",
    label: "Off"
  },
  {
    value: "1",
    label: "1/128Hz"
  },
  {
    value: "2",
    label: "2/128Hz"
  },
  {
    value: "3",
    label: "3/128Hz"
  },
  {
    value: "4",
    label: "4/128Hz"
  },
  {
    value: "5",
    label: "5/128Hz"
  },
  {
    value: "6",
    label: "6/128Hz"
  },
  {
    value: "7",
    label: "7/128Hz"
  }
];

interface InstrumentDutyEditorProps {
  id: string;
  instrument?: DutyInstrument
}

export const InstrumentDutyEditor = ({
  instrument
}: InstrumentDutyEditorProps) => {

  if (!instrument) return <>EMPTY</>;

  const selectedDuty = dutyOptions.find((i) => parseInt(i.value, 10) === instrument.duty_cycle);

  const selectedSweepTime = sweepTimeOptions.find((i) => parseInt(i.value, 10) === instrument.frequency_sweep_time);

  const onChangeFieldInput = <T extends keyof DutyInstrument>(key: T) => (
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
          label={l10n("FIELD_SWEEP_CHANGE")}

          value={instrument.volume_sweep_change || 0}
          min={-7}
          max={7}
        // onChange={onChangeFieldInput("volume_sweep_change")}
        />
      </FormRow>

      <FormDivider />

      <FormRow>
        <FormField
          name="frequency_sweep_time"
          label={l10n("FIELD_SWEEP_TIME")}
        >
          <Select
            name="frequency_sweep_time"
            value={selectedSweepTime}
            options={sweepTimeOptions}
            onChange={onChangeFieldInput("frequency_sweep_time")}
          />
        </FormField>
      </FormRow>

        <FormRow>
          <SliderField
            name="frequency_sweep_shift"
            label={l10n("FIELD_SWEEP_SHIFT")}
            value={instrument.frequency_sweep_shift || 0}
            min={-7}
            max={7}
          // onChange={onChangeFieldInput("frequency_sweep_shift")}
          />
        </FormRow>

        <FormDivider />

        <FormRow>
          <FormField
            name="frequency_sweep_shift"
            label={l10n("FIELD_DUTY")}
          >
            <Select
              name="duty_cycle"
              value={selectedDuty}
              options={dutyOptions}
              onChange={onChangeFieldInput("duty_cycle")}
            />
          </FormField>
        </FormRow>

    </>
  );
}