import React, { ReactNode, useCallback } from "react";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import { TriangleIcon } from "ui/icons/Icons";

interface SplitPaneHeaderProps {
  variant?: "normal" | "secondary";
  children: ReactNode;
  buttons?: ReactNode;
  collapsed: boolean;
  sticky?: boolean;
  onToggle?: () => void;
}

interface WrapperProps {
  variant?: "normal" | "secondary";
  collapsible: boolean;
  sticky?: boolean;
}

export const Wrapper = styled.div<WrapperProps>`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 5px;
  height: 30px;
  flex-shrink: 0;
  background-color: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};

  ${(props) =>
    props.variant === "secondary"
      ? css`
          background-color: ${(props) => props.theme.colors.sidebar.background};
          border-bottom: 1px solid
            ${(props) => props.theme.colors.sidebar.border};
        `
      : ""};

  ${(props) =>
    props.collapsible
      ? css`
          &:active {
            background-color: ${(props) =>
              props.theme.colors.input.hoverBackground};
          }
        `
      : css`
          padding-left: 10px;
        `};

  ${(props) =>
    props.sticky
      ? css`
          position: sticky;
          top: 0;
          z-index: 1;
        `
      : ""}

  > span {
    flex-grow: 1;
  }

  ${Button} {
    padding: 4px;
    min-width: 18px;
  }
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
`;

interface CollapseIconProps {
  collapsed: boolean;
}

const CollapseIcon = styled.div<CollapseIconProps>`
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 8px;
    transform: rotate(180deg);
    fill: ${(props) => props.theme.colors.input.text};
  }

  ${(props) =>
    props.collapsed
      ? css`
          svg {
            transform: rotate(90deg);
          }
        `
      : ""}
`;

export const SplitPaneHeader: React.FC<SplitPaneHeaderProps> = ({
  children,
  buttons,
  onToggle,
  collapsed,
  variant,
  sticky,
}) => {
  const stopPropagation = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <Wrapper
      onClick={onToggle}
      collapsible={!!onToggle}
      variant={variant}
      sticky={sticky}
    >
      {onToggle && (
        <CollapseIcon collapsed={collapsed}>
          <TriangleIcon />
        </CollapseIcon>
      )}
      <span>{children}</span>
      {buttons && <Buttons onClick={stopPropagation}>{buttons}</Buttons>}
    </Wrapper>
  );
};
