import React from "react";
import { useDispatch } from "react-redux";
import l10n from "../../lib/helpers/l10n";
import trackerDocumentActions from "../../store/features/trackerDocument/trackerDocumentActions";
import { DutyInstrument } from "../../store/features/trackerDocument/trackerDocumentTypes";
import { FormDivider, FormField, FormRow } from "../ui/form/FormLayout";
import { Select } from "../ui/form/Select";
import { SliderField } from "../ui/form/SliderField";
import { InstrumentLengthForm } from "./InstrumentLengthForm";

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
  const dispatch = useDispatch();

  if (!instrument) return <></>;

  const selectedDuty = dutyOptions.find((i) => parseInt(i.value, 10) === instrument.duty_cycle);

  const selectedSweepTime = sweepTimeOptions.find((i) => parseInt(i.value, 10) === instrument.frequency_sweep_time);

  const onChangeField = <T extends keyof DutyInstrument>(key: T) => (
    editValue: DutyInstrument[T]
  ) => {
    dispatch(
      trackerDocumentActions.editDutyInstrument({
        instrumentId: instrument.index,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onChangeFieldSelect = <T extends keyof DutyInstrument>(key: T) => (
    e: { value: string, label: string }
  ) => {
    const editValue = e.value;
    dispatch(
      trackerDocumentActions.editDutyInstrument({
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
        <FormField
          name="frequency_sweep_time"
          label={l10n("FIELD_SWEEP_TIME")}
        >
          <Select
            name="frequency_sweep_time"
            value={selectedSweepTime}
            options={sweepTimeOptions}
            onChange={onChangeFieldSelect("frequency_sweep_time")}
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
            onChange={(value) => {
              onChangeField("frequency_sweep_shift")(value || 0);
            }}
            />
        </FormRow>

        <FormDivider />

        <FormRow>
          <FormField
            name="duty_cycle"
            label={l10n("FIELD_DUTY")}
          >
            <Select
              name="duty_cycle"
              value={selectedDuty}
              options={dutyOptions}
              onChange={onChangeFieldSelect("duty_cycle")}
            />
          </FormField>
        </FormRow>
    </>
  );
}