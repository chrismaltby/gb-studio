import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { StyledInput as StyledInputDefault } from "./style";

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

const StyledInput = styled(StyledInputDefault)`
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

const valueToString = (value: unknown) =>
  value !== undefined && value !== null ? String(value) : "";

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
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stringValue, setStringValue] = useState(valueToString(value));

  const onChangeInternal = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStringValue = e.currentTarget.value;
      setStringValue(newStringValue);
      onChange?.(e);
    },
    [onChange],
  );

  const onBlurInternal = useCallback(() => {
    setStringValue(valueToString(value));
  }, [value]);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setStringValue(valueToString(value));
    }
  }, [value]);

  return (
    <Wrapper>
      <StyledInput
        ref={inputRef}
        id={name}
        name={name}
        type="number"
        value={stringValue}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChangeInternal}
        onBlur={onBlurInternal}
      />
      <Label htmlFor={name}>{coordinate}</Label>
    </Wrapper>
  );
};
