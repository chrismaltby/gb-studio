import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "../../store/configureStore";
import trackerActions from "../../store/features/tracker/trackerActions";
import { CheckboxField } from "../ui/form/CheckboxField";
import { FormField } from "../ui/form/FormLayout";
import { Select } from "../ui/form/Select";
import { InstrumentSelect } from "./InstrumentSelect";

const octaveOffsetOptions: OctaveOffsetOptions[] = [0, 1, 2, 3].map((i) => ({
  value: i,
  label: `Octave ${i + 3}`
}));

interface OctaveOffsetOptions {
  value: number;
  label: string;
}

const Wrapper = styled.div`
  position: absolute;
  top: 5px;
  right: 10px;
  z-index: 10;
  width: 280px;
  display: flex;
`;

const SongEditorRightToolsPanel = () => {
  const dispatch = useDispatch();

  const octaveOffset = useSelector(
    (state: RootState) => state.tracker.present.octaveOffset
  );

  const setOctaveOffset = useCallback((offset: number) => {
    dispatch(trackerActions.setOctaveOffset(offset));
  }, [dispatch]);

  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.present.defaultInstruments
  );

  const setDefaultInstruments = useCallback((instrument: number) => {
    dispatch(trackerActions.setDefaultInstruments(
      [instrument, instrument, instrument, instrument]
    ));
  }, [dispatch]);

  const visibleChannels = useSelector(
    (state: RootState) => state.tracker.present.visibleChannels
  );

  const setVisibleChannels = useCallback((channel: number) => () => {
    const newVisibleChannels = [channel];
    dispatch(trackerActions.setVisibleChannels(newVisibleChannels));
  }, [dispatch])

  return (
    <Wrapper>
      <FormField name="visibleChannels">
        <CheckboxField name="channelDuty1" 
          label="Duty 1" 
          onChange={setVisibleChannels(0)} 
          checked={visibleChannels.indexOf(0) > -1}
        /> 
        <CheckboxField name="channelDuty2" 
        label="Duty 2"
        onChange={setVisibleChannels(1)} 
        checked={visibleChannels.indexOf(1) > -1}
      /> 
      </FormField>
      <FormField name="visibleChannels">
        <CheckboxField name="channelWave" label="Wave"        
        onChange={setVisibleChannels(2)} 
        checked={visibleChannels.indexOf(2) > -1}
        /> 
        <CheckboxField name="channelNoise" label="Noise"        
          onChange={setVisibleChannels(3)} 
          checked={visibleChannels.indexOf(3) > -1}
        /> 
      </FormField>

      <FormField name="defaultInstrument" label="Instrument">
        <InstrumentSelect
          name="instrument"
          value={`${defaultInstruments[0]}`}
          onChange={(newValue) => {
            setDefaultInstruments(parseInt(newValue))
          }}
        />
      </FormField>

      <FormField name="octave" label="Base Octave">
        <Select
          value={octaveOffsetOptions.find((i) => i.value === octaveOffset)}
          options={octaveOffsetOptions}
          onChange={(newValue: OctaveOffsetOptions) => {
            setOctaveOffset(newValue.value);
          }}
        />
      </FormField>
    </Wrapper>
  );
};

export default SongEditorRightToolsPanel;