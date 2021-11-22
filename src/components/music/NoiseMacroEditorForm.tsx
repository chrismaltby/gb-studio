import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { FormRow } from "ui/form/FormLayout";

interface NoiseMacroEditorFormProps {
  macros: number[];
  onChange: (editValue: any) => void;
}

export const NoiseMacroEditorForm = ({
  macros,
  onChange,
}: NoiseMacroEditorFormProps) => {
  const dispatch = useDispatch();

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

    const drawGrid = (noiseMacros: number[]) => {
      if (ctx) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.beginPath();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;

        for (let i = 0; i <= macros.length; i++) {
          ctx.moveTo(5 + (i * drawWidth) / 6, 0);
          ctx.lineTo(5 + (i * drawWidth) / 6, canvas.height);
        }
        for (let i = 0; i <= 64; i++) {
          ctx.moveTo(0, 5 + (i * drawHeight) / 32);
          ctx.lineTo(canvas.width, 5 + (i * drawHeight) / 32);
        }
        ctx.stroke();
      }
    };

    const drawMacros = (noiseMacros: number[], color?: string) => {
      if (ctx) {
        const ratio = drawHeight / 64;

        ctx.beginPath();

        ctx.fillStyle = color || defaultColor;
        ctx.strokeStyle = color || defaultColor;
        ctx.lineWidth = 1;

        ctx.moveTo(5, 5 + 32 * ratio);
        ctx.lineTo(5 + drawWidth, 5 + 32 * ratio);
        ctx.stroke();

        noiseMacros.forEach((y: number, x: number) => {
          ctx.fillRect(
            5 + x * (drawWidth / 6),
            5 + drawHeight / 2,
            drawWidth / 6,
            -y * ratio
          );
        });
      }
    };

    drawGrid(macros);
    drawMacros(macros);

    let mousedown = false;
    let newMacros = [...macros];

    canvas.onmouseout = () => {
      if (!mousedown) {
        drawGrid(macros);
        drawMacros(macros);
      }
    };

    const handleMouseMove = (e: any) => {
      if (e.target !== canvasRef.current) {
        return;
      }

      if (ctx) {
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const pos = {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };

        const gridP = {
          i: Math.floor((pos.x - 5) / (drawWidth / 6)),
          j: Math.floor((pos.y - 5) / (drawHeight / 64)),
        };

        if (gridP.j <= 64 && gridP.j >= 0 && gridP.i < 6) {
          drawGrid(macros);
          drawMacros(macros, "#FF000066");

          if (!mousedown) {
            newMacros = [...macros];
          }
          newMacros[gridP.i] = 32 - gridP.j;
          drawMacros(newMacros);
        }
      }
    };

    const handleMouseDown = (e: any) => {
      if (e.target === canvasRef.current) {
        mousedown = true;
      }
    };

    const handleMouseUp = (e: any) => {
      if (mousedown) {
        mousedown = false;
        onChange(newMacros);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
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
            cursor: "pointer",
          }}
          height={138}
        />
      </FormRow>
    </>
  );
};
