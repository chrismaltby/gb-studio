import React, { useContext, useEffect, useRef } from "react";
import l10n from "shared/lib/lang/l10n";
import { ThemeContext } from "styled-components";
import { FormRow } from "ui/form/layout/FormLayout";
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
    key: T,
  ) => (editValue: EditableInstrument[T]) => void;
}

const PADDING = 10;

// For UI preview flip positive values so the control feels symmetric
// The value is flipped back before being stored after changes.
const flipSweepChange = (value: number) => {
  if (value <= 0) {
    return value;
  }
  return 8 - value;
};

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

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;

    const drawWidth = canvas.width - PADDING * 2;
    const drawHeight = canvas.height - PADDING * 2;
    const ctx = canvas.getContext("2d");

    const normalisedVolume = initialVolume / 15;
    const secLength = length === null ? 1 : length / 256;
    const centerLineY = canvas.height - PADDING - (7 / 15) * drawHeight;

    const defaultColor = themeContext.colors.highlight;

    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;
    // eslint-disable-next-line no-self-assign
    canvas.height = canvas.height;

    if (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.beginPath();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.moveTo(0, centerLineY);
      ctx.lineTo(canvas.width, centerLineY);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      ctx.shadowColor = defaultColor;
      ctx.shadowBlur = 5; // glow strength

      ctx.beginPath();
      ctx.moveTo(
        PADDING,
        canvas.height - PADDING - normalisedVolume * drawHeight,
      );

      let localVolumeSweepChange;
      if (volumeSweepChange < 0) {
        //fade down
        localVolumeSweepChange = volumeSweepChange + 8;
        const envLength = ((localVolumeSweepChange / 64) * initialVolume) / 2;

        ctx.lineTo(
          PADDING + Math.min(envLength, secLength) * drawWidth,
          drawHeight +
            PADDING -
            (1 - Math.min(secLength / envLength, 1)) *
              normalisedVolume *
              drawHeight,
        );
        ctx.lineTo(PADDING + secLength * drawWidth, canvas.height - PADDING);
      } else if (volumeSweepChange > 0) {
        //fade up
        localVolumeSweepChange = 8 - volumeSweepChange;
        const envLength = ((volumeSweepChange / 64) * (15 - initialVolume)) / 2;

        ctx.lineTo(
          PADDING + Math.min(envLength, secLength) * drawWidth,
          (1 - Math.min(secLength / envLength, 1)) *
            normalisedVolume *
            drawHeight +
            PADDING,
        );
        ctx.lineTo(
          PADDING + secLength * drawWidth,
          (1 - Math.min(secLength / envLength, 1)) *
            normalisedVolume *
            drawHeight +
            PADDING,
        );
      } else {
        //no fade
        ctx.lineTo(
          PADDING + secLength * drawWidth,
          canvas.height - PADDING - normalisedVolume * drawHeight,
        );
      }

      if (secLength !== 1) {
        ctx.lineTo(PADDING + secLength * drawWidth, canvas.height - PADDING);
        if (secLength < 1) {
          ctx.lineTo(PADDING + drawWidth, canvas.height - PADDING);
        }
      }

      ctx.shadowColor = defaultColor;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "black";
      for (let i = 0; i < 10; i++) {
        ctx.stroke();
        ctx.shadowBlur = i * 6;
      }

      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.shadowBlur = 0;
      ctx.strokeStyle = defaultColor;
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
          value={flipSweepChange(volumeSweepChange || 0)}
          min={-7}
          max={7}
          onChange={(value) => {
            onChange("volume_sweep_change")(flipSweepChange(value || 0));
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
