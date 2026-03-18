import React from "react";
import { StyledButtonGroup } from "./style";

export interface ButtonGroupProps {
  children: React.ReactNode;
}

export const ButtonGroup = ({ children }: ButtonGroupProps) => (
  <StyledButtonGroup>{children}</StyledButtonGroup>
);
