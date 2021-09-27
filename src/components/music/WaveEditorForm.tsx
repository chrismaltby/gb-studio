import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Select } from "ui/form/Select";
import l10n from "lib/helpers/l10n";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { RootState } from "store/configureStore";
import { FormRow, FormField } from "ui/form/FormLayout";

interface WaveEditorFormProps {
  waveId: number;
  onChange: (newValue: { value: string; label: string }) => void;
}

export const WaveEditorForm = ({ waveId, onChange }: WaveEditorFormProps) => {
  const dispatch = useDispatch();

  const song = useSelector(
    (state: RootState) => state.trackerDocument.present.song
  );

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
      })
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

    const drawWidth = canvas.width - 10;
    const drawHeight = canvas.height - 10;
    const pointLength = drawWidth / (song.waves[waveId].length - 1);
    const pointHeight = drawHeight / 15;

    const ctx = canvas.getContext("2d");

    const defaultColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--highlight-color");

    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;
    // eslint-disable-next-line no-self-assign
    canvas.height = canvas.height;

    const drawGrid = (waves: Uint8Array) => {
      if (ctx) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.beginPath();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        for (let i = 0; i < waves.length; i++) {
          ctx.moveTo(5 + i * pointLength, 0);
          ctx.lineTo(5 + i * pointLength, canvas.height);
        }
        for (let i = 0; i <= 15; i++) {
          ctx.moveTo(0, 5 + i * pointHeight);
          ctx.lineTo(canvas.width, 5 + i * pointHeight);
        }
        ctx.stroke();
      }
    };

    const drawWave = (waves: Uint8Array, color?: string) => {
      if (ctx) {
        ctx.beginPath();

        ctx.strokeStyle = color ? color : defaultColor;
        ctx.lineWidth = 2;
        waves.forEach((y: number, x: number) => {
          ctx.lineTo(5 + x * pointLength, 5 + drawHeight - y * pointHeight);
        });

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
          i: Math.floor(pos.x / pointLength),
          j: Math.floor(pos.y / pointHeight),
        };

        if (gridP.j < 16) {
          drawGrid(song.waves[waveId]);

          drawWave(song.waves[waveId], "#FF000066");

          if (!mousedown) {
            newWaves = new Uint8Array(song.waves[waveId]);
          }
          newWaves[gridP.i] = 15 - gridP.j;
          drawWave(newWaves);
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
            onChange={onChange}
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
    </>
  );
};
