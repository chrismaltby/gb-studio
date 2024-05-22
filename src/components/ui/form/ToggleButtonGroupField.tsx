import React from "react";
import styled from "styled-components";
import {
  ToggleButtonGroup,
  ToggleButtonGroupOption,
} from "./ToggleButtonGroup";
import { Label } from "./Label";

export type ToggleButtonGroupFieldProps<T> = {
  name: string;
  label?: string;
  value: T;
  options: ToggleButtonGroupOption<T>[];
  onChange: (newValue: T) => void;
};

const Wrapper = styled.div`
  width: 100%;
`;

export const ToggleButtonGroupField = <T,>({
  name,
  label,
  value,
  options,
  onChange,
}: ToggleButtonGroupFieldProps<T>) => (
  <Wrapper>
    {label && <Label htmlFor={name}>{label}</Label>}
    <ToggleButtonGroup
      name={name}
      value={value}
      options={options}
      onChange={onChange}
    />
  </Wrapper>
);

ToggleButtonGroupField.defaultProps = {
  value: undefined,
};
