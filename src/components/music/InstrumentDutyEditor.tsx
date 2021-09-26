import React from "react";
import { useDispatch } from "react-redux";
import l10n from "lib/helpers/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { DutyInstrument } from "store/features/trackerDocument/trackerDocumentTypes";
import { FormDivider, FormField, FormRow } from "ui/form/FormLayout";
import { Select } from "ui/form/Select";
import { SliderField } from "ui/form/SliderField";
import { InstrumentLengthForm } from "./InstrumentLengthForm";
import { InstrumentVolumeEditor } from "./InstrumentVolumeEditor";
import { ipcRenderer } from "electron";
import { Button } from "ui/buttons/Button";

const dutyOptions = [
  {
    value: "0",
    label: "12.5%",
  },
  {
    value: "1",
    label: "25%",
  },
  {
    value: "2",
    label: "50%",
  },
  {
    value: "3",
    label: "75%",
  },
];

const sweepTimeOptions = [
  {
    value: "0",
    label: "Off",
  },
  {
    value: "1",
    label: "1/128Hz",
  },
  {
    value: "2",
    label: "2/128Hz",
  },
  {
    value: "3",
    label: "3/128Hz",
  },
  {
    value: "4",
    label: "4/128Hz",
  },
  {
    value: "5",
    label: "5/128Hz",
  },
  {
    value: "6",
    label: "6/128Hz",
  },
  {
    value: "7",
    label: "7/128Hz",
  },
];

interface InstrumentDutyEditorProps {
  id: string;
  instrument?: DutyInstrument;
}

export const InstrumentDutyEditor = ({
  instrument,
}: InstrumentDutyEditorProps) => {
  const dispatch = useDispatch();

  if (!instrument) return <></>;

  const selectedDuty = dutyOptions.find(
    (i) => parseInt(i.value, 10) === instrument.duty_cycle
  );

  const selectedSweepTime = sweepTimeOptions.find(
    (i) => parseInt(i.value, 10) === instrument.frequency_sweep_time
  );

  const onChangeField =
    <T extends keyof DutyInstrument>(key: T) =>
    (editValue: DutyInstrument[T]) => {
      dispatch(
        trackerDocumentActions.editDutyInstrument({
          instrumentId: instrument.index,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeFieldSelect =
    <T extends keyof DutyInstrument>(key: T) =>
    (e: { value: string; label: string }) => {
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

  const onTestInstrument = () => {
    ipcRenderer.send("music-data-send", {
      action: "preview",
      note: 24, // C_5
      type: "duty",
      instrument: instrument,
      square2: false,
    });
  };

  return (
    <>
      <InstrumentLengthForm
        value={instrument.length}
        onChange={onChangeField("length")}
      />

      <FormDivider />

      <InstrumentVolumeEditor
        initial_volume={instrument.initial_volume}
        volume_sweep_change={instrument.volume_sweep_change}
        length={instrument.length}
        onChange={onChangeField}
      />

      <FormDivider />

      <FormRow>
        <FormField name="frequency_sweep_time" label={l10n("FIELD_SWEEP_TIME")}>
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
        <FormField name="duty_cycle" label={l10n("FIELD_DUTY")}>
          <Select
            name="duty_cycle"
            value={selectedDuty}
            options={dutyOptions}
            onChange={onChangeFieldSelect("duty_cycle")}
          />
        </FormField>
      </FormRow>

      <FormDivider />

      <FormRow>
        <Button onClick={onTestInstrument}>
          {l10n("FIELD_TEST_INSTRUMENT")}
        </Button>
      </FormRow>
    </>
  );
};
