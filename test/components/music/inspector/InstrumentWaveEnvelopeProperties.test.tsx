/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render } from "../../../react-utils";
import { InstrumentWaveEnvelopeProperties } from "components/music/inspector/instruments/InstrumentWaveEnvelopeProperties";

test("Should allow keyboard arrowing down from 100 percent volume to 50 percent", () => {
  const onChangeVolume = jest.fn();

  const { getAllByRole } = render(
    <InstrumentWaveEnvelopeProperties
      volume={1}
      length={null}
      onChangeVolume={onChangeVolume}
      onChangeLength={jest.fn()}
    />,
  );

  const knobs = getAllByRole("slider");
  const mappedVolumeKnob = knobs[knobs.length - 1];

  if (mappedVolumeKnob) {
    fireEvent.keyDown(mappedVolumeKnob, { key: "ArrowLeft" });
  }

  expect(onChangeVolume).toHaveBeenCalledWith(2);
});
