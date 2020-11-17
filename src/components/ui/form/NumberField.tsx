import React, { FC } from "react";
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
}) => (
  <Wrapper>
    {label && <Label htmlFor={name}>{label}</Label>}
    <Input
      type="number"
      id={name}
      name={name}
      value={value || ""}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={onChange}
    />
  </Wrapper>
);

NumberField.defaultProps = {
  value: undefined,
};
