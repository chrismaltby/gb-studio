import React, { useContext } from "react";
import { ThemeContext } from "styled-components";

interface VibratoWaveformPreviewProps {
  waveform: string;
}
export const VibratoWaveformPreview = ({
  waveform,
}: VibratoWaveformPreviewProps) => {
  const themeContext = useContext(ThemeContext);

  let path = "";

  [...waveform].forEach((l: string, i: number) => {
    path += `${i * 10},${5 + (parseInt(l) - 1) * -10} ${(i + 1) * 10},${
      5 + (parseInt(l) - 1) * -10
    } `;
  });

  const defaultColor = themeContext?.colors.highlight;

  return (
    <div style={{ height: 20 }}>
      <svg width="100%" height="100%">
        <polyline
          points={path}
          stroke={defaultColor}
          fill="none"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
