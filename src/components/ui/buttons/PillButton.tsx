import React, { forwardRef } from "react";
import { StyledPillButton } from "ui/buttons/style";

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "normal" | "primary" | "blue";
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ variant, ...props }, ref) => (
    <StyledPillButton ref={ref} $variant={variant} {...props} />
  ),
);
