import styled, { css } from "styled-components";
import { StyledButton } from "ui/buttons/style";

// #region SplitPaneHeader

interface StyledSplitPaneHeaderProps {
  $variant?: "normal" | "secondary";
  $collapsible: boolean;
  $sticky?: boolean;
  $borderBottom?: boolean;
}

export const StyledSplitPaneHeader = styled.div<StyledSplitPaneHeaderProps>`
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

  ${(props) =>
    props.$borderBottom
      ? css`
          border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
        `
      : ""};

  ${(props) =>
    props.$variant === "secondary"
      ? css`
          background-color: ${(props) => props.theme.colors.sidebar.background};
          border-bottom: 1px solid
            ${(props) => props.theme.colors.sidebar.border};
        `
      : ""};

  ${(props) =>
    props.$collapsible
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
    props.$sticky
      ? css`
          position: sticky;
          top: 0;
          z-index: 1;
        `
      : ""}

  > span {
    flex-grow: 1;
  }

  ${StyledButton} {
    padding: 4px;
    min-width: 18px;
  }
`;

export const StyledSplitPaneHeaderButtons = styled.div`
  display: flex;
  align-items: center;
`;

interface StyledSplitPaneHeaderCollapseIconProps {
  $collapsed: boolean;
}

export const StyledSplitPaneHeaderCollapseIcon = styled.div<StyledSplitPaneHeaderCollapseIconProps>`
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
    props.$collapsed
      ? css`
          svg {
            transform: rotate(90deg);
          }
        `
      : ""}
`;

// #endregion SplitPaneHeader

// #region SplitPaneDivider

export const StyledSplitPaneHorizontalDivider = styled.div`
  width: 1px;
  height: 100%;
  background-color: ${(props) => props.theme.colors.sidebar.border};
  cursor: ew-resize;
  position: relative;
  z-index: 1;

  &:before {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: -5px;
    width: 10px;
    height: 100%;
  }

  &:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: -4px;
    width: 9px;
    height: 100%;
    background-color: ${(props) => props.theme.colors.sidebar.border};
    opacity: 0.3;
    transform: scale(0, 1);
    transition: all 0.3s ease-in-out;
  }

  &:hover:after {
    transform: scale(1, 1);
  }
`;

export const StyledSplitPaneVerticalDivider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${(props) => props.theme.colors.sidebar.border};
  cursor: ns-resize;
  position: relative;
  z-index: 1;

  &:before {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    top: -5px;
    height: 10px;
    width: 100%;
  }

  &:after {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    top: -4px;
    height: 9px;
    width: 100%;
    background-color: ${(props) => props.theme.colors.sidebar.border};
    opacity: 0.3;
    transform: scale(1, 0);
    transition: all 0.3s ease-in-out;
  }

  &:hover:after {
    transform: scale(1, 1);
  }
`;

// #endregion SplitPaneDivider
