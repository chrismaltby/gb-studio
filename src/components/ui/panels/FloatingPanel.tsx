import React, { ReactNode } from "react";
import {
  StyledFloatingPanel,
  StyledFloatingPanelBreak,
  StyledFloatingPanelDivider,
} from "ui/panels/style";

interface FloatingPanelProps {
  vertical?: boolean;
  className?: string;
  children?: ReactNode;
}

export const FloatingPanel = ({
  vertical,
  className,
  children,
}: FloatingPanelProps) => (
  <StyledFloatingPanel
    className={className}
    $vertical={vertical}
    children={children}
  />
);

export const FloatingPanelDivider = () => <StyledFloatingPanelDivider />;

export const FloatingPanelBreak = () => <StyledFloatingPanelBreak />;
