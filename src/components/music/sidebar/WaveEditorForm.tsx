import React, { useContext, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Select } from "ui/form/Select";
import l10n from "shared/lib/lang/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { FormRow, FormField } from "ui/form/layout/FormLayout";
import { ThemeContext } from "styled-components";
import { WaveEditorInput } from "components/music/sidebar/WaveEditorInput";
import clamp from "shared/lib/helpers/clamp";

interface WaveEditorFormProps {
  waveId: number;
  onChange: (newValue: { value: number; label: string }) => void;
}

const PADDING = 10;

export const WaveEditorForm = ({ waveId, onChange }: WaveEditorFormProps) => {
  const dispatch = useAppDispatch();

  const song = useAppSelector((state) => state.trackerDocument.present.song);
  const themeContext = useContext(ThemeContext);

  const waveOptions = song?.waves.map((wave: Uint8Array, i: number) => ({
    value: i,
    label: `Waveform ${i}`,
  }));
  const selectedWave = waveOptions?.find((wave) => wave.value === waveId);

  const onEditWave = (newWave: Uint8Array) => {
    dispatch(
      trackerDocumentActions.editWaveform({
        index: waveId,
        waveForm: newWave,
      }),
    );
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!song) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;

    const drawWidth = canvas.width - PADDING * 2;
    const drawHeight = canvas.height - PADDING * 2;
    const pointLength = drawWidth / (song.waves[waveId].length - 1);
    const pointHeight = drawHeight / 15;

    const ctx = canvas.getContext("2d");

    const defaultColor = themeContext?.colors.highlight ?? "black";

    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;
    // eslint-disable-next-line no-self-assign
    canvas.height = canvas.height;

    const drawGrid = (waves: Uint8Array) => {
      if (!ctx) return;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;

      for (let i = -1; i < waves.length + 1; i++) {
        const x = PADDING + i * pointLength + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }

      for (let i = -1; i <= 16; i++) {
        const y = PADDING + i * pointHeight + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }

      ctx.stroke();
    };

    const drawWave = (waves: Uint8Array, color?: string) => {
      if (ctx) {
        ctx.beginPath();

        ctx.strokeStyle = color ? color : defaultColor;
        ctx.lineWidth = 2;
        waves.forEach((y: number, x: number) => {
          ctx.lineTo(
            PADDING + x * pointLength,
            PADDING + drawHeight - y * pointHeight,
          );
        });

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
    };

    drawGrid(song.waves[waveId]);
    drawWave(song.waves[waveId]);

    let mousedown = false;
    let newWaves = new Uint8Array(song.waves[waveId]);

    canvas.onmouseout = () => {
      if (!mousedown) {
        drawGrid(song.waves[waveId]);
        drawWave(song.waves[waveId]);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
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
          i: clamp(
            Math.round((pos.x - PADDING) / pointLength),
            0,
            song.waves[waveId].length - 1,
          ),
          j: clamp(Math.round((pos.y - PADDING) / pointHeight), 0, 15),
        };

        if (gridP.j < 16) {
          drawGrid(song.waves[waveId]);
          if (!mousedown) {
            newWaves = new Uint8Array(song.waves[waveId]);
          }
          newWaves[gridP.i] = clamp(15 - gridP.j, 0, 15);
          drawWave(newWaves);
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === canvasRef.current) {
        mousedown = true;
      }
    };

    const handleMouseUp = (_e: MouseEvent) => {
      if (mousedown) {
        mousedown = false;
        onEditWave(newWaves);
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
        <FormField name="wave_index" label={l10n("FIELD_WAVEFORM")}>
          <Select
            name="wave_index"
            value={selectedWave}
            options={waveOptions}
            onChange={(e) => e && onChange(e)}
          />
        </FormField>
      </FormRow>
      <FormRow>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "120px",
            backgroundColor: "#000",
            borderRadius: 4,
            cursor: "pointer",
          }}
          height={120}
        />
      </FormRow>
      <FormRow>
        <WaveEditorInput waveId={waveId} onEditWave={onEditWave} />
      </FormRow>
    </>
  );
};
