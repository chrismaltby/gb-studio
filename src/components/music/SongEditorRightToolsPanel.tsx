import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store/configureStore";
import trackerActions from "store/features/tracker/trackerActions";
import { FormField } from "ui/form/FormLayout";
import { Select } from "ui/form/Select";
import { InstrumentSelect } from "./InstrumentSelect";
import { ChannelSelectField } from "./ChannelSelectField";

const octaveOffsetOptions: OctaveOffsetOptions[] = [0, 1, 2, 3].map((i) => ({
  value: i,
  label: `Octave ${i + 3}`,
}));

interface OctaveOffsetOptions {
  value: number;
  label: string;
}

interface SongEditorRightToolsPanelProps {
  channelStatus: boolean[];
}

const Wrapper = styled.div`
  position: absolute;
  top: 5px;
  right: 10px;
  z-index: 10;
  width: 280px;
  display: flex;
`;

const SongEditorRightToolsPanel = ({
  channelStatus,
}: SongEditorRightToolsPanelProps) => {
  const dispatch = useDispatch();

  const view = useSelector((state: RootState) => state.tracker.view);

  const octaveOffset = useSelector(
    (state: RootState) => state.tracker.octaveOffset
  );

  const setOctaveOffset = useCallback(
    (offset: number) => {
      dispatch(trackerActions.setOctaveOffset(offset));
    },
    [dispatch]
  );

  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.defaultInstruments
  );

  const setDefaultInstruments = useCallback(
    (instrument: number) => {
      dispatch(
        trackerActions.setDefaultInstruments([
          instrument,
          instrument,
          instrument,
          instrument,
        ])
      );
    },
    [dispatch]
  );

  return (
    <Wrapper>
      {view === "roll" ? (
        <>
          <FormField name="visibleChannels">
            <ChannelSelectField
              name="channelDuty1"
              label="Duty 1"
              index={0}
              muted={channelStatus[0]}
            />
            <ChannelSelectField
              name="channelDuty2"
              label="Duty 2"
              index={1}
              muted={channelStatus[1]}
            />
            <ChannelSelectField
              name="channelWave"
              label="Wave"
              index={2}
              muted={channelStatus[2]}
            />
            <ChannelSelectField
              name="channelNoise"
              label="Noise"
              index={3}
              muted={channelStatus[3]}
            />
          </FormField>
        </>
      ) : (
        ""
      )}
      {view === "tracker" ? (
        <FormField name="octave" label="Base Octave">
          <Select
            value={octaveOffsetOptions.find((i) => i.value === octaveOffset)}
            options={octaveOffsetOptions}
            onChange={(newValue: OctaveOffsetOptions) => {
              setOctaveOffset(newValue.value);
            }}
          />
        </FormField>
      ) : (
        ""
      )}
      <FormField name="defaultInstrument" label="Instrument">
        <InstrumentSelect
          name="instrument"
          value={`${defaultInstruments[0]}`}
          onChange={(newValue) => {
            setDefaultInstruments(parseInt(newValue));
          }}
        />
      </FormField>
    </Wrapper>
  );
};

export default SongEditorRightToolsPanel;
