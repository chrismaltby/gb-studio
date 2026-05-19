import React, { useContext, useEffect, useRef } from "react";
import { ThemeContext } from "styled-components";

interface NoiseMacroEditorFormProps {
  macros: number[];
  onChange: (editValue: number[]) => void;
}

export const NoiseMacroEditorForm = ({
  macros,
  onChange,
}: NoiseMacroEditorFormProps) => {
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

    const defaultColor = themeContext?.colors.tracker.wave ?? "#fff";
    const backgroundColor =
      themeContext?.colors.tracker.waveBackground ?? "#000";
    const gridColor = themeContext?.colors.tracker.waveGrid ?? "#333";

    const getLayout = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const cssWidth = rect.width;
      const cssHeight = rect.height;

      const pixelWidth = Math.round(cssWidth * dpr);
      const pixelHeight = Math.round(cssHeight * dpr);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      return {
        rect,
        width: cssWidth,
        height: cssHeight,
        drawLeft: 5,
        drawTop: 5,
        drawWidth: cssWidth - 10,
        drawHeight: cssHeight - 10,
      };
    };

    const clear = () => {
      const { width, height } = getLayout();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    };

    const drawGrid = (noiseMacros: number[]) => {
      const { width, height, drawLeft, drawTop, drawWidth, drawHeight } =
        getLayout();

      clear();

      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      for (let i = 0; i <= noiseMacros.length; i++) {
        const gridX =
          Math.round(drawLeft + (i * drawWidth) / noiseMacros.length) + 0.5;
        ctx.moveTo(gridX, 0);
        ctx.lineTo(gridX, height);
      }

      for (let i = 0; i <= 72; i += 12) {
        const gridY = Math.round(drawTop + (i * drawHeight) / 72) + 0.5;
        ctx.moveTo(0, gridY);
        ctx.lineTo(width, gridY);
      }

      ctx.stroke();
    };

    const drawMacros = (noiseMacros: number[], isPreview?: boolean) => {
      const { drawLeft, drawTop, drawWidth, drawHeight } = getLayout();
      const ratio = drawHeight / 72;

      ctx.beginPath();

      ctx.fillStyle = defaultColor;
      ctx.strokeStyle = defaultColor;
      ctx.lineWidth = 1;

      const midY = Math.round(drawTop + 36 * ratio) + 0.5;
      ctx.moveTo(drawLeft, midY);
      ctx.lineTo(drawLeft + drawWidth, midY);
      ctx.stroke();

      if (isPreview) {
        ctx.globalAlpha = 0.2;
      }

      noiseMacros.forEach((y, x) => {
        const left =
          Math.round(drawLeft + (x * drawWidth) / noiseMacros.length) + 1;
        const right = Math.round(
          drawLeft + ((x + 1) * drawWidth) / noiseMacros.length,
        );

        const barX = left;
        const barW = Math.max(1, right - left);
        const barY = Math.round(drawTop + drawHeight / 2);
        const barH = Math.round(-y * ratio);

        ctx.shadowColor = defaultColor;
        ctx.shadowBlur = 15;

        ctx.fillRect(barX, barY, barW, barH);
        ctx.shadowBlur = 0;
      });

      if (isPreview) {
        ctx.globalAlpha = 1;
      }
    };

    const redraw = (noiseMacros: number[]) => {
      drawGrid(noiseMacros);
      drawMacros(noiseMacros);
    };

    redraw(macros);

    let mousedown = false;
    let newMacros = [...macros];

    const handleMouseOut = () => {
      if (!mousedown) {
        redraw(macros);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.target !== canvasRef.current) {
        return;
      }

      const { rect, drawLeft, drawTop, drawWidth, drawHeight } = getLayout();

      const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const columnWidth = drawWidth / macros.length;
      const rowHeight = drawHeight / 72;

      const gridP = {
        i: Math.floor((pos.x - drawLeft) / columnWidth),
        j: Math.floor((pos.y - drawTop) / rowHeight),
      };

      if (
        gridP.j <= 72 &&
        gridP.j >= 0 &&
        gridP.i >= 0 &&
        gridP.i < macros.length
      ) {
        drawGrid(macros);
        drawMacros(macros, true);

        if (!mousedown) {
          newMacros = [...macros];
        }

        newMacros[gridP.i] = 36 - gridP.j;
        drawMacros(newMacros);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === canvasRef.current) {
        mousedown = true;
      }
    };

    const handleMouseUp = () => {
      if (mousedown) {
        mousedown = false;
        onChange(newMacros);
      }
    };

    const handleResize = () => redraw(macros);

    canvas.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
    };
  }, [macros, onChange, themeContext]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: 100,
        backgroundColor: "#000",
        cursor: "pointer",
        display: "block",
      }}
    />
  );
};
