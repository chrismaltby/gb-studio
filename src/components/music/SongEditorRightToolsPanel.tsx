import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "../../store/configureStore";
import trackerActions from "../../store/features/tracker/trackerActions";
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
    (state: RootState) => state.tracker.octaveOffset
  );

  const setOctaveOffset = useCallback((offset: number) => {
    dispatch(trackerActions.setOctaveOffset(offset));
  }, [dispatch]);

  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.defaultInstruments
  );

  const setDefaultInstruments = useCallback((instrument: number) => {
    dispatch(trackerActions.setDefaultInstruments(
      [instrument, instrument, instrument, instrument]
    ));
  }, [dispatch]);

  return (
    <Wrapper>
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