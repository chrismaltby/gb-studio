import React, { FC } from "react";
import styled from "styled-components";
import {
  ToggleButtonGroup,
  ToggleButtonGroupOption,
} from "./ToggleButtonGroup";
import { Label } from "./Label";

export interface ToggleButtonGroupFieldProps {
  name: string;
  label?: string;
  value: string;
  options: ToggleButtonGroupOption[];
}

const Wrapper = styled.div`
  width: 100%;
`;

export const ToggleButtonGroupField: FC<ToggleButtonGroupFieldProps> = ({
  name,
  label,
  value,
  options,
}) => (
  <Wrapper>
    {label && <Label htmlFor={name}>{label}</Label>}
    <ToggleButtonGroup name={name} value={value} options={options} />
  </Wrapper>
);

ToggleButtonGroupField.defaultProps = {
  value: undefined,
};
