import React, { FC } from "react";
import styled from "styled-components";
import { Slider } from "./Slider";
import { Label } from "./Label";
import { StyledInput } from "./style";
import { NumberInput } from "./NumberInput";

interface SliderFieldProps {
  name: string;
  label?: string;
  value?: number;
  placeholder?: number;
  min: number;
  max: number;
  step?: number;
  onChange?: (value?: number) => void;
}

const Wrapper = styled.div`
  width: 100%;
`;

const SliderWrapper = styled.div`
  width: 100%;

  @container (max-width: 150px) {
    display: none;
  }
`;

const InnerWrapper = styled.div`
  display: flex;
  container-type: inline-size;

  ${StyledInput} {
    width: 70px;
    margin-right: 10px;
    flex-shrink: 0;
  }
`;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const SliderField: FC<SliderFieldProps> = ({
  name,
  label,
  value,
  min,
  max,
  step,
  placeholder,
  onChange,
}) => {
  const sliderValue =
    value !== undefined
      ? clamp(value || 0, min, max)
      : clamp(placeholder || 0, min, max);
  const inputValue =
    value !== undefined ? String(clamp(value || 0, min, max)) : "";
  return (
    <Wrapper>
      {label && <Label htmlFor={name}>{label}</Label>}
      <InnerWrapper>
        <NumberInput
          id={name}
          type="number"
          name={name}
          value={inputValue}
          placeholder={placeholder !== undefined ? String(placeholder) : ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const newValue =
              e.currentTarget.value.length > 0
                ? clamp(parseFloat(e.currentTarget.value), min, max)
                : undefined;
            onChange?.(newValue);
          }}
        />
        <SliderWrapper>
          <Slider
            value={sliderValue}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
          />
        </SliderWrapper>
      </InnerWrapper>
    </Wrapper>
  );
};
