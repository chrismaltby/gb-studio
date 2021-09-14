import React, { useEffect, useRef } from "react";
import { FormRow } from "ui/form/FormLayout";

interface NoiseMacroEditorFormProps {
  macros: number[];
}

export const NoiseMacroEditorForm = ({ macros }: NoiseMacroEditorFormProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const drawWidth = canvas.width - 10;
    const drawHeight = canvas.height - 10;
    const ctx = canvas.getContext("2d");

    const defaultColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--highlight-color");

    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;
    // eslint-disable-next-line no-self-assign
    canvas.height = canvas.height;

    if (ctx) {
      const ratio = drawHeight / 64;

      ctx.fillStyle = defaultColor;
      ctx.strokeStyle = defaultColor;
      ctx.lineWidth = 1;

      ctx.moveTo(5, 5 + 32 * ratio);
      ctx.lineTo(drawWidth, 5 + 32 * ratio);
      ctx.stroke();

      macros.forEach((y: number, x: number) => {
        ctx.fillRect(
          5 + x * (drawWidth / 6),
          5 + drawHeight / 2,
          drawWidth / 6,
          -y * ratio
        );
      });
    }
  });

  return (
    <>
      <FormRow>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "138px",
            backgroundColor: "#000",
            borderRadius: 4,
            imageRendering: "pixelated",
          }}
          height={138}
        />
      </FormRow>
    </>
  );
};
