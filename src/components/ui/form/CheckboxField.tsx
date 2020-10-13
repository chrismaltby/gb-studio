import React, { FC } from "react";
import styled from "styled-components";
import { Checkbox } from "./Checkbox";
import { Label } from "./Label";

export interface CheckboxFieldProps {
  name: string;
  label?: string;
  checked?: boolean;
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;

  ${Label} {
    margin-left: 5px;
  }
`;

export const CheckboxField: FC<CheckboxFieldProps> = ({
  name,
  label,
  checked,
}) => (
  <Wrapper>
    <Checkbox id={name} name={name} checked={checked} />
    {label && <Label htmlFor={name}>{label}</Label>}
  </Wrapper>
);

CheckboxField.defaultProps = {
  checked: undefined,
};
