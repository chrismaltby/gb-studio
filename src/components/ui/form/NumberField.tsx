import React, { FC, useState } from "react";
import styled from "styled-components";
import { Input } from "./Input";
import { Label } from "./Label";

export interface NumberFieldProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  name: string;
  label?: string;
  value?: number;
}

const Wrapper = styled.div`
  width: 100%;
`;

export const NumberField: FC<NumberFieldProps> = ({
  name,
  label,
  value,
  min,
  max,
  placeholder,
  onChange,
}) => {
  const [val, setVal] = useState(String(value));
  let displayVal = val;
  if (displayVal && !isNaN(Number(displayVal))) {
    if (min) {
      displayVal = String(Math.max(Number(min), Number(displayVal)));
    }
    if (max) {
      displayVal = String(Math.min(Number(max), Number(displayVal)));
    }
  }
  return (
    <Wrapper>
      {label && <Label htmlFor={name}>{label}</Label>}
      <Input
        type="number"
        id={name}
        name={name}
        value={displayVal}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => {
          setVal(e.currentTarget.value);
          onChange?.(e);
        }}
      />
    </Wrapper>
  );
};

NumberField.defaultProps = {
  value: undefined,
};
