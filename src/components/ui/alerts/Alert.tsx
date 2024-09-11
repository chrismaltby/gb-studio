import React, { ReactNode } from "react";
import StyledAlert, { StyledAlertItem } from "ui/alerts/style";

interface AlertProps {
  variant: "warning" | "info";
  children?: ReactNode;
}

interface AlertItemProps {
  children?: ReactNode;
}

export const AlertItem = ({ children }: AlertItemProps) => (
  <StyledAlertItem children={children} />
);

export const Alert = ({ children, variant }: AlertProps) => (
  <StyledAlert $variant={variant} children={children} />
);
