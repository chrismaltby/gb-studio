import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { ValueType, ActionMeta } from "react-select";
import { Select } from "../ui/form/Select";
import l10n from "../../lib/helpers/l10n";
import { RootState } from "../../store/configureStore";
import { FormRow, FormField } from "../ui/form/FormLayout";

interface WaveEditorFormProps {
  waveId: number,
  onChange: (value: ValueType<any>, actionMeta: ActionMeta<any>) => void;
}

export const WaveEditorForm = ({
  waveId,
  onChange
}: WaveEditorFormProps) => {

  const song = useSelector((state: RootState) =>
    state.trackerDocument.present.song
  );

  const waveOptions = song?.waves.map((wave: Uint8Array, i: number) => ({
    value: i,
    label: `Waveform ${i}`
  }));
  const selectedWave = waveOptions?.find((wave) => wave.value === waveId);

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
    const ctx = canvas.getContext("2d");

    const defaultColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--highlight-color");

    canvas.width = canvas.clientWidth;

    if (ctx) {

      const pointLength = drawWidth / (song.waves[waveId].length - 1);
      const pointHeight = drawHeight / 15;

      ctx.strokeStyle = defaultColor;
      ctx.lineWidth = 2;
      song.waves[waveId].forEach((y: number, x: number) => {
        ctx.lineTo(5 + x * pointLength, 5 + drawHeight - y * pointHeight);
      });

      ctx.stroke();
    }
  });

  return (
    <>
      <FormRow>
        <FormField
          name="wave_index"
          label={l10n("FIELD_WAVEFORM")}
        >
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
            height: "100px",
            backgroundColor: "#000",
            borderRadius: 4,
          }}
          height={100}
        />
      </FormRow>
    </>
  );
}