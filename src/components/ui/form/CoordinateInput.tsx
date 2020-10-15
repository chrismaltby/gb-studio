import React, { FC } from "react";
import styled from "styled-components";
import { Input } from "./Input";

export interface CoordinateInputProps {
  coordinate: "x" | "y" | "w" | "h";
  name: string;
  value?: number;
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
  border-right: 1px solid ${props => props.theme.colors.input.border};
`;

export const CoordinateInput: FC<CoordinateInputProps> = ({
  name,
  coordinate = "x",
  value,
}) => (
  <Wrapper>
    <StyledInput id={name} name={name} type="number" value={value} />
    <Label htmlFor={name}>{coordinate}</Label>
  </Wrapper>
);
