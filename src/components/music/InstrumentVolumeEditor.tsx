import React, { useContext, useEffect, useRef } from "react";
import l10n from "shared/lib/lang/l10n";
import { ThemeContext } from "styled-components";
import { FormRow } from "ui/form/FormLayout";
import { SliderField } from "ui/form/SliderField";

type EditableInstrument = {
  initial_volume: number;
  volume_sweep_change: number;
};

interface InstrumentVolumeEditorProps {
  initialVolume: number;
  volumeSweepChange: number;
  length: number | null;
  onChange: <T extends keyof EditableInstrument>(
    key: T
  ) => (editValue: EditableInstrument[T]) => void;
}

export const InstrumentVolumeEditor = ({
  initialVolume,
  volumeSweepChange,
  length,
  onChange,
}: InstrumentVolumeEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeContext = useContext(ThemeContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (!themeContext) {
      return;
    }

    const drawWidth = canvas.width - 10;
    const drawHeight = canvas.height - 10;
    const ctx = canvas.getContext("2d");

    const normalisedVolume = initialVolume / 15;
    const secLength = length === null ? 1 : length / 256;

    const defaultColor = themeContext.colors.highlight;

    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;
    // eslint-disable-next-line no-self-assign
    canvas.height = canvas.height;

    if (ctx) {
      ctx.strokeStyle = defaultColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(5, canvas.height - 5 - normalisedVolume * drawHeight);

      let localVolumeSweepChange;
      if (volumeSweepChange < 0) {
        //fade down
        localVolumeSweepChange = volumeSweepChange + 8;
        const envLength = ((localVolumeSweepChange / 64) * initialVolume) / 2;

        ctx.lineTo(
          5 + Math.min(envLength, secLength) * drawWidth,
          drawHeight +
            5 -
            (1 - Math.min(secLength / envLength, 1)) *
              normalisedVolume *
              drawHeight
        );
        ctx.lineTo(5 + secLength * drawWidth, canvas.height - 5);
      } else if (volumeSweepChange > 0) {
        //fade up
        localVolumeSweepChange = 8 - volumeSweepChange;
        const envLength = ((volumeSweepChange / 64) * (15 - initialVolume)) / 2;

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
  }, [initialVolume, length, themeContext, volumeSweepChange]);

  return (
    <>
      <FormRow>
        <SliderField
          name="initial_volume"
          label={l10n("FIELD_INITIAL_VOLUME")}
          value={initialVolume || 0}
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
          value={volumeSweepChange || 0}
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
