import React, { FC } from "react";
import styled from "styled-components";
import { Select } from "./Select";
import { Label } from "./Label";

interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  name: string;
  label?: string;
  value?: SelectFieldOption;
  options: SelectFieldOption[];
}

const Wrapper = styled.div`
  width: 100%;
`;

export const SelectField: FC<SelectFieldProps> = ({
  name,
  label,
  value,
  options,
}) => (
  <Wrapper>
    {label && <Label htmlFor={name}>{label}</Label>}
    <Select inputId={name} name={name} value={value} options={options} />
  </Wrapper>
);

SelectField.defaultProps = {
  value: undefined,
};
