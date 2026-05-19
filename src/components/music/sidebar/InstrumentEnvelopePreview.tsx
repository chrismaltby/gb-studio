import React, { useContext, useEffect, useRef } from "react";
import { ThemeContext } from "styled-components";

interface InstrumentEnvelopePreviewProps {
  volume: number;
  sweep: number;
  length: number | null;
}

const PADDING = 10;

export const InstrumentEnvelopePreview = ({
  volume,
  sweep,
  length,
}: InstrumentEnvelopePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeContext = useContext(ThemeContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !themeContext) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const width = rect.width;
    const height = rect.height;

    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const drawWidth = width - PADDING * 2;
    const drawHeight = height - PADDING * 2;

    const normalisedVolume = volume / 15;
    const secLength = length === null ? 1 : length / 256;
    const centerLineY = height - PADDING - (7 / 15) * drawHeight;

    const defaultColor = themeContext?.colors.tracker.wave ?? "#fff";
    const backgroundColor =
      themeContext?.colors.tracker.waveBackground ?? "#000";
    const gridColor = themeContext?.colors.tracker.waveGrid ?? "#333";

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // center line
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.moveTo(0, Math.round(centerLineY) + 0.5);
    ctx.lineTo(width, Math.round(centerLineY) + 0.5);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.lineCap = "round";

    ctx.shadowColor = defaultColor;
    ctx.shadowBlur = 5;

    ctx.beginPath();
    ctx.moveTo(PADDING, height - PADDING - normalisedVolume * drawHeight);

    let localsweep;

    if (sweep < 0) {
      // fade down
      localsweep = sweep + 8;
      const envLength = ((localsweep / 64) * volume) / 2;
      const progress = envLength > 0 ? Math.min(secLength / envLength, 1) : 1;
      const currentVolume = volume * (1 - progress);
      const currentY = height - PADDING - (currentVolume / 15) * drawHeight;

      ctx.lineTo(
        PADDING + Math.min(envLength, secLength) * drawWidth,
        currentY,
      );

      ctx.lineTo(PADDING + secLength * drawWidth, height - PADDING);
    } else if (sweep > 0) {
      // fade up
      localsweep = 8 - sweep;
      const envLength = ((localsweep / 64) * (15 - volume)) / 2;
      const progress = envLength > 0 ? Math.min(secLength / envLength, 1) : 1;
      const currentVolume = volume + (15 - volume) * progress;
      const currentY = height - PADDING - (currentVolume / 15) * drawHeight;

      ctx.lineTo(
        PADDING + Math.min(envLength, secLength) * drawWidth,
        currentY,
      );

      ctx.lineTo(PADDING + secLength * drawWidth, currentY);
    } else {
      // no fade
      ctx.lineTo(
        PADDING + secLength * drawWidth,
        height - PADDING - normalisedVolume * drawHeight,
      );
    }

    if (secLength !== 1) {
      ctx.lineTo(PADDING + secLength * drawWidth, height - PADDING);
      if (secLength < 1) {
        ctx.lineTo(PADDING + drawWidth, height - PADDING);
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
  }, [volume, length, themeContext, sweep]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100px",
        backgroundColor: "#000",
        borderRadius: 4,
        display: "block",
      }}
    />
  );
};
