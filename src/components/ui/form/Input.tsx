import React from "react";
import { StyledInput } from "ui/form/style";

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly displaySize?: "small" | "medium" | "large";
}

export const Input = ({ displaySize = "medium", ...props }: InputProps) => {
  return <StyledInput $displaySize={displaySize} {...props} />;
};
