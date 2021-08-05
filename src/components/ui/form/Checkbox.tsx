import React, { FC } from "react";
import styled from "styled-components";
import { MenuItem } from "../menu/Menu";

export interface CheckboxProps {
  readonly id: string;
  readonly name: string;
  readonly checked?: boolean;
  readonly onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const HiddenCheckbox = styled.input.attrs({ type: "checkbox" })`
  margin: 0px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  opacity: 0;
`;

const StyledCheckbox = styled.div`
  pointer-events: none;
  display: inline-block;
  width: 16px;
  height: 16px;
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  border-radius: 4px;
  ${HiddenCheckbox}:checked + & {
    background: ${(props) => props.theme.colors.highlight};
    border: 1px solid ${(props) => props.theme.colors.highlight};
  }
  ${HiddenCheckbox}:focus + & {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight} !important;
    transition: box-shadow 0.2s cubic-bezier(0.175, 0.885, 0.71, 2.65);
  }

  ${MenuItem} & {
    width: 14px;
    height: 14px;
  }
`;

const CheckboxContainer = styled.div`
  position: relative;
  display: inline-block;
  vertical-align: middle;
  top: 2px;

  ${MenuItem} > & {
    margin-left: -5px;
    margin-right: 5px;
    margin-bottom: -2px;
  }
`;

const Icon = styled.svg`
  fill: none;
  stroke: white;
  stroke-width: 2px;
  opacity: 0;

  ${HiddenCheckbox}:checked + * > & {
    opacity: 1;
  }
`;

export const Checkbox: FC<CheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  ...props
}) => (
  <CheckboxContainer>
    <HiddenCheckbox
      id={id}
      name={name}
      checked={checked}
      onChange={onChange}
      {...props}
    />
    <StyledCheckbox>
      <Icon viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </Icon>
    </StyledCheckbox>
  </CheckboxContainer>
);
