import React, { ReactNode, useCallback } from "react";
import { TriangleIcon } from "ui/icons/Icons";
import {
  StyledSplitPaneHeader,
  StyledSplitPaneHeaderButtons,
  StyledSplitPaneHeaderCollapseIcon,
} from "ui/splitpane/style";

interface SplitPaneHeaderProps {
  variant?: "normal" | "secondary";
  children: ReactNode;
  buttons?: ReactNode;
  collapsed: boolean;
  sticky?: boolean;
  borderTop?: boolean;
  borderBottom?: boolean;
  onToggle?: () => void;
}

export const SplitPaneHeader: React.FC<SplitPaneHeaderProps> = ({
  children,
  buttons,
  onToggle,
  collapsed,
  variant,
  sticky,
  borderTop = false,
  borderBottom = true,
}) => {
  const stopPropagation = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <StyledSplitPaneHeader
      onClick={onToggle}
      $collapsible={!!onToggle}
      $variant={variant}
      $sticky={sticky}
      $borderTop={borderTop}
      $borderBottom={borderBottom}
    >
      {onToggle && (
        <StyledSplitPaneHeaderCollapseIcon $collapsed={collapsed}>
          <TriangleIcon />
        </StyledSplitPaneHeaderCollapseIcon>
      )}
      <span>{children}</span>
      {buttons && (
        <StyledSplitPaneHeaderButtons onClick={stopPropagation}>
          {buttons}
        </StyledSplitPaneHeaderButtons>
      )}
    </StyledSplitPaneHeader>
  );
};
