import React from "react";
import { StyledButton } from "./style";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly id?: string;
  readonly size?: "small" | "medium" | "large";
  readonly variant?: "normal" | "primary" | "transparent" | "underlined";
  readonly active?: boolean;
}

export const Button = ({
  id,
  size = "medium",
  variant = "normal",
  active,
  ...props
}: ButtonProps) => {
  return (
    <StyledButton
      id={id}
      $size={size}
      $variant={variant}
      $active={active}
      {...props}
    />
  );
};
