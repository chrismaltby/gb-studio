import React from "react";
import { StyledButton } from "./style";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly id?: string;
  readonly size?: "small" | "medium" | "large";
  readonly variant?:
    "normal" | "primary" | "transparent" | "underlined" | "anchor";
  readonly active?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { id, size = "medium", variant = "normal", active, ...props }: ButtonProps,
    ref,
  ) => {
    return (
      <StyledButton
        ref={ref}
        id={id}
        $size={size}
        $variant={variant}
        $active={active}
        data-is-active={active}
        {...props}
      />
    );
  },
);
