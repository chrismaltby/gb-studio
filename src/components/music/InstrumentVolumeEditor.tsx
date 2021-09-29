import React, { useEffect, useRef } from "react";
import l10n from "lib/helpers/l10n";
import { CheckboxField } from "ui/form/CheckboxField";
import { FormRow } from "ui/form/FormLayout";
import { SliderField } from "ui/form/SliderField";
import {
  DutyInstrument,
  NoiseInstrument,
} from "store/features/trackerDocument/trackerDocumentTypes";

interface InstrumentVolumeEditorProps {
  initial_volume: number;
  volume_sweep_change: number;
  length: number | null;
  // onChange: <T extends keyof (DutyInstrument | NoiseInstrument)>(key: T) => (editValue: (DutyInstrument[T] | NoiseInstrument[T])) => void;
  onChange: (key: any) => (editValue: any) => void;
}

export const InstrumentVolumeEditor = ({
  initial_volume,
  volume_sweep_change,
  length,
  onChange,
}: InstrumentVolumeEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const drawWidth = canvas.width - 10;
    const drawHeight = canvas.height - 10;
    const ctx = canvas.getContext("2d");

    const normalisedVolume = initial_volume / 15;
    const secLength = length === null ? 1 : length / 256;

    const defaultColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--highlight-color");

    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;
    // eslint-disable-next-line no-self-assign
    canvas.height = canvas.height;

    if (ctx) {
      ctx.strokeStyle = defaultColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(5, canvas.height - 5 - normalisedVolume * drawHeight);

      if (volume_sweep_change < 0) {
        //fade down
        volume_sweep_change = volume_sweep_change + 8;
        const envLength = ((volume_sweep_change / 64) * initial_volume) / 2;

        ctx.lineTo(
          5 + Math.min(envLength, secLength) * drawWidth,
          drawHeight +
            5 -
            (1 - Math.min(secLength / envLength, 1)) *
              normalisedVolume *
              drawHeight
        );
        ctx.lineTo(5 + secLength * drawWidth, canvas.height - 5);
      } else if (volume_sweep_change > 0) {
        //fade up
        volume_sweep_change = 8 - volume_sweep_change;
        const envLength =
          ((volume_sweep_change / 64) * (15 - initial_volume)) / 2;

        ctx.lineTo(
          5 + Math.min(envLength, secLength) * drawWidth,
          (1 - Math.min(secLength / envLength, 1)) *
            normalisedVolume *
            drawHeight +
            5
        );
        ctx.lineTo(
          5 + secLength * drawWidth,
          (1 - Math.min(secLength / envLength, 1)) *
            normalisedVolume *
            drawHeight +
            5
        );
      } else {
        //no fade
        ctx.lineTo(
          5 + secLength * drawWidth,
          canvas.height - 5 - normalisedVolume * drawHeight
        );
      }

      if (secLength !== 1) {
        ctx.lineTo(5 + secLength * drawWidth, canvas.height - 5);
        if (secLength < 1) {
          ctx.lineTo(5 + drawWidth, canvas.height - 5);
        }
      }
      ctx.stroke();
    }
  });

  return (
    <>
      <FormRow>
        <SliderField
          name="initial_volume"
          label={l10n("FIELD_INITIAL_VOLUME")}
          value={initial_volume || 0}
          min={0}
          max={15}
          onChange={(value) => {
            onChange("initial_volume")(value || 0);
          }}
        />
      </FormRow>

      <FormRow>
        <SliderField
          name="volume_sweep_change"
          label={l10n("FIELD_VOLUME_SWEEP_CHANGE")}
          value={volume_sweep_change || 0}
          min={-7}
          max={7}
          onChange={(value) => {
            onChange("volume_sweep_change")(value || 0);
          }}
        />
      </FormRow>

      <FormRow>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100px",
            backgroundColor: "#000",
            borderRadius: 4,
          }}
          height={100}
        />
      </FormRow>
    </>
  );
};
