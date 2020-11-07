import React, { FC, useContext } from "react";
import styled, { css, ThemeContext } from "styled-components";
import { Range, getTrackBackground } from "react-range";

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange?: (value: number) => void;
}

export const SliderWrapper = styled.div`
  width: calc(100% - 20px);
  position: relative;
`;

const RangeInner = styled.div`
  display: flex;
  width: 100%;
  height: 28px;
`;

const RangeTrack = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 4px;
  align-self: center;
  background: ${(props) => props.theme.colors.input.border};
`;

interface RangeThumbProps {
  isDragged: boolean;
}

const RangeThumb = styled.div<RangeThumbProps>`
  height: 12px;
  width: 12px;
  border-radius: 12px;
  background: ${(props) => props.theme.colors.button.background};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  ${(props) =>
    props.isDragged
      ? css`
          background: ${(props) => props.theme.colors.highlight};
          border: 1px solid ${(props) => props.theme.colors.highlight};
        `
      : ""}
`;

export const Slider: FC<SliderProps> = ({ value, min, max, onChange }) => {
  const themeContext = useContext(ThemeContext);

  return (
    <Range
      min={min}
      max={max}
      values={[value]}
      onChange={(values) => onChange?.(values[0])}
      renderTrack={({ props, children }) => (
        <RangeInner
          onMouseDown={props.onMouseDown}
          onTouchStart={props.onTouchStart}
          style={props.style}
        >
          <RangeTrack
            ref={props.ref}
            style={{
              background: getTrackBackground({
                values: [value],
                colors: [
                  themeContext.colors.highlight,
                  themeContext.colors.input.border,
                ],
                min,
                max,
              }),
            }}
          >
            {children}
          </RangeTrack>
        </RangeInner>
      )}
      renderThumb={({ props, isDragged }) => (
        <RangeThumb {...props} isDragged={isDragged} style={props.style} />
      )}
    />
  );
};
