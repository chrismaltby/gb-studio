import React, { FC } from "react";
import styled from "styled-components";
import { Input } from "./Input";

export interface CoordinateInputProps {
  coordinate: "x" | "y" | "w" | "h";
  name: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledInput = styled(Input)`
  padding-left: 32px;
`;

const Label = styled.label`
  position: absolute;
  top: 1px;
  left: 0px;
  bottom: 1px;
  width: 27px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: bold;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  border-right: 1px solid ${(props) => props.theme.colors.input.border};
`;

export const CoordinateInput: FC<CoordinateInputProps> = ({
  name,
  coordinate = "x",
  value,
  min,
  max,
  step,
  placeholder,
  disabled,
  onChange,
}) => (
  <Wrapper>
    <StyledInput
      id={name}
      name={name}
      type="number"
      value={value !== undefined ? value : ""}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange}
    />
    <Label htmlFor={name}>{coordinate}</Label>
  </Wrapper>
);
