import React, { useCallback, useMemo, useRef } from "react";
import styled from "styled-components";

type ColorSliderProps = {
  value: number;
  steps: number;
  colorAtValue: (value: number) => string;
  onChange: (value: number) => void;
};

const Wrapper = styled.div`
  display: flex;
  position: relative;
`;

const Color = styled.div`
  flex-grow: 1;
  max-width: 32px;
  height: 32px;
  border: 1px solid transparent;

  :first-of-type {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    min-width: 5px;
    flex-shrink: 0;
  }

  :nth-last-of-type(2) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    min-width: 5px;
    flex-shrink: 0;
  }
`;

const Handle = styled.div`
  position: absolute;
  width: 10px;
  margin-left: -5px;
  margin-top: -3px;
  height: 100%;
  border-radius: 4px;
  padding: 2px;
  box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.3);
  border: 1px solid ${(props) => props.theme.colors.input.background};
`;

const ColorSlider = ({
  value,
  onChange,
  steps,
  colorAtValue,
}: ColorSliderProps) => {
  const boundingRect = useRef<DOMRect>();

  const stepValues = useMemo(() => Array.from(Array(steps).keys()), [steps]);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (boundingRect.current) {
        const x = e.clientX - boundingRect.current.left;
        const value = x / boundingRect.current.width;
        onChange(value);
      }
    },
    [onChange]
  );

  const onMouseUp = useCallback(
    (_e: MouseEvent) => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    },
    [onMouseMove]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!(e.currentTarget instanceof HTMLElement)) {
        return;
      }
      boundingRect.current = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - boundingRect.current.left;
      const value = x / boundingRect.current.width;
      onChange(value);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [onChange, onMouseMove, onMouseUp]
  );

  return (
    <Wrapper onMouseDown={onMouseDown}>
      {stepValues.map((stepIndex) => {
        const normalisedValue = stepIndex / (stepValues.length - 1);
        const color = colorAtValue(normalisedValue);
        return (
          <Color
            key={stepIndex}
            style={{
              backgroundColor: color,
            }}
          />
        );
      })}
      <Handle
        style={{
          left: `${value * 100}%`,
          backgroundColor: colorAtValue(value),
        }}
      />
    </Wrapper>
  );
};

export default ColorSlider;
