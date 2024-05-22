import React, { FC } from "react";
import styled from "styled-components";
import { Checkbox } from "./Checkbox";
import { Label } from "./Label";

export interface CheckboxFieldProps {
  readonly name: string;
  readonly label?: string;
  readonly title?: string;
  readonly checked?: boolean;
  readonly onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 28px;

  ${Label} {
    margin-left: 5px;
    margin-bottom: 0px;
    margin-top: -1px;
  }
`;

export const CheckboxField: FC<CheckboxFieldProps> = ({
  name,
  label,
  title,
  checked,
  onChange,
}) => (
  <Wrapper>
    <Checkbox id={name} name={name} checked={checked} onChange={onChange} />
    {label && (
      <Label htmlFor={name} title={title}>
        {label}
      </Label>
    )}
  </Wrapper>
);

CheckboxField.defaultProps = {
  checked: undefined,
};
