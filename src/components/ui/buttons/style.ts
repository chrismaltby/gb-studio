import styled, { css } from "styled-components";

// #region Button

interface StyledButtonProps {
  readonly $size?: "small" | "medium" | "large";
  readonly $variant?:
    | "normal"
    | "primary"
    | "transparent"
    | "underlined"
    | "anchor";
  readonly $active?: boolean;
  readonly disabled?: boolean;
}

export const StyledButton = styled.button<StyledButtonProps>`
  user-select: none;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  height: 28px;
  min-width: 24px;
  white-space: nowrap;
  padding: 0px 10px;
  box-sizing: border-box;
  font-weight: normal;
  border-width: 1px;
  overflow: hidden;
  flex-shrink: 0;

  svg {
    height: 17px;
    width: 17px;
    max-width: 100%;
    max-height: 100%;
    min-width: 17px;
    fill: ${(props) => props.theme.colors.button.text};
    opacity: ${(props) => (props.disabled ? 0.3 : 1)};
  }

  ${(props) => (props.$size === "small" ? smallStyles : "")}
  ${(props) => (props.$size === "large" ? largeStyles : "")}
  ${(props) => (props.$variant === "normal" ? normalStyles : "")}
  ${(props) => (props.$variant === "primary" ? primaryStyles : "")}
  ${(props) => (props.$variant === "transparent" ? transparentStyles : "")}
  ${(props) => (props.$variant === "underlined" ? underlinedStyles : "")}
  ${(props) => (props.$variant === "anchor" ? anchorStyles : "")}
`;

const smallStyles = css`
  font-size: 9px;
  padding: 6px;
  height: 22px;

  svg {
    height: 10px;
    width: 10px;
    max-width: 10px;
    max-height: 10px;
    margin: 0 -6px;
  }
`;

const largeStyles = css`
  height: 42px;
  padding: 0px 20px;
  font-size: 15px;
  font-weight: bold;
`;

const normalStyles = css<StyledButtonProps>`
  background: ${(props) => props.theme.colors.button.background};
  border: 1px solid ${(props) => props.theme.colors.button.border};
  color: ${(props) => props.theme.colors.button.text};

  ${(props) =>
    props.disabled
      ? css`
          opacity: 0.5;
        `
      : ""}

  &:active {
    background: ${(props) => props.theme.colors.button.activeBackground};
  }
`;

const primaryStyles = css`
  background: ${(props) => props.theme.colors.highlight};
  border-color: transparent;
  color: ${(props) => props.theme.colors.highlightText};

  && > svg {
    fill: ${(props) => props.theme.colors.highlightText};
  }

  &:active {
    opacity: 0.8;
  }
  &:focus {
    box-shadow:
      0 0 0px 2px #fff,
      0 0 0px 4px ${(props) => props.theme.colors.highlight};
  }
`;

const transparentStyles = css<StyledButtonProps>`
  background: transparent;
  border-color: transparent;
  color: ${(props) => props.theme.colors.button.text};

  ${(props) =>
    !props.disabled
      ? css`
          &:hover {
            background: rgba(128, 128, 128, 0.1);
          }
          &:active {
            background: rgba(128, 128, 128, 0.2);
          }
        `
      : ""}

  ${(props) =>
    props.$active
      ? css`
          background: rgba(128, 128, 128, 0.3);
          &:hover {
            background: rgba(128, 128, 128, 0.3);
          }
          &:active {
            background: rgba(128, 128, 128, 0.2);
          }
        `
      : ""}
`;

const underlinedStyles = css<StyledButtonProps>`
  background: transparent;
  border-color: transparent;
  color: ${(props) => props.theme.colors.button.text};
  position: relative;
  overflow: visible;

  &:after {
    content: "";
    border-bottom: 2px solid ${(props) => props.theme.colors.highlight};
    width: 100%;
    position: absolute;
    bottom: -2px;
  }

  ${(props) =>
    !props.disabled
      ? css`
          &:hover {
            background: rgba(128, 128, 128, 0.1);
          }
          &:active {
            background: rgba(128, 128, 128, 0.2);
          }
        `
      : ""}

  ${(props) =>
    props.$active
      ? css`
          background: rgba(128, 128, 128, 0.3);
          &:hover {
            background: rgba(128, 128, 128, 0.3);
          }
          &:active {
            background: rgba(128, 128, 128, 0.2);
          }
        `
      : ""}
`;

const anchorStyles = css<StyledButtonProps>`
  background: transparent;
  border-color: transparent;
  color: ${(props) => props.theme.colors.highlight};
  text-decoration: underline;
  position: relative;
  overflow: visible;
  padding: 0;
  height: auto;
  cursor: pointer;

  ${(props) =>
    !props.disabled
      ? css`
          &:active {
            background: rgba(128, 128, 128, 0.2);
          }
        `
      : ""}
`;

export const ButtonPrefixIcon = styled.div`
  svg {
    height: 12px;
    width: 12px;
    max-width: 12px;
    max-height: 12px;
    margin-left: -5px;
    margin-bottom: -2px;
  }
`;

// #endregion Button

// #region ZoomButton

interface StyledZoomInnerButtonProps {
  readonly $pin: "left" | "right";
}

export const StyledZoomInnerButton = styled.button<StyledZoomInnerButtonProps>`
  position: absolute;
  top: 5px;
  left: ${(props) => (props.$pin === "left" ? "4px" : "auto")};
  right: ${(props) => (props.$pin === "right" ? "4px" : "auto")};
  display: block;
  background: ${(props) => props.theme.colors.button.nestedBackground};
  border-radius: 20px;
  height: 16px;
  width: 16px;
  line-height: 16px;
  padding: 0;
  border: 0;
  flex-shrink: 0;

  &:active {
    background: ${(props) => props.theme.colors.button.nestedActiveBackground};
  }

  &:after {
    content: "";
    position: absolute;
    left: -4px;
    top: -2px;
    display: block;
    width: 24px;
    height: 20px;
    opacity: 0;
  }

  & > svg {
    width: 8px;
    height: 8px;
    fill: ${(props) => props.theme.colors.button.text};
  }
`;

interface StyledZoomLabelProps {
  readonly $size?: "small" | "medium";
  readonly $variant?: "normal" | "transparent";
}

export const StyledZoomLabel = styled.button<StyledZoomLabelProps>`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 13px;
  border-radius: ${(props) => props.theme.borderRadius}px;
  width: 98px;
  height: 26px;
  flex-shrink: 0;
  white-space: nowrap;
  box-sizing: border-box;
  font-weight: normal;
  border-width: 1px;
  overflow: hidden;

  -webkit-app-region: no-drag;
  background: ${(props) => props.theme.colors.button.background};
  border: 1px solid ${(props) => props.theme.colors.toolbar.button.border};
  color: ${(props) => props.theme.colors.button.text};
  padding: 0px 5px;

  &:active {
    background: ${(props) => props.theme.colors.button.activeBackground};
  }

  ${(props) => (props.$size === "small" ? zoomLabelSmallStyles : "")}

  ${(props) =>
    props.$variant === "transparent"
      ? css`
          background: transparent;
          border: 0;
        `
      : ""}
`;

const zoomLabelSmallStyles = css`
  font-size: 11px;
  width: 80px;
`;

export const StyledZoomButton = styled.div`
  position: relative;
  width: fit-content;
`;

//#endregion ZoomButton

// #region PillButton

interface StyledPillButtonProps {
  readonly $variant?: "normal" | "primary" | "blue";
}

export const StyledPillButton = styled.button<StyledPillButtonProps>`
  user-select: none;
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: ${(props) => props.theme.typography.fontSize};

  &:active {
    color: ${(props) => props.theme.colors.button.text};
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }

  ${(props) => (props.$variant === "primary" ? pillButtonPrimaryStyles : "")}
  ${(props) => (props.$variant === "blue" ? pillButtonBlueStyles : "")}
`;

const pillButtonPrimaryStyles = css`
  background: ${(props) => props.theme.colors.highlight};
  border-color: transparent;
  color: #fff;

  svg {
    fill: #fff;
  }

  &:active {
    opacity: 0.8;
    color: #fff;
    background: ${(props) => props.theme.colors.highlight};
  }
  &:focus {
    box-shadow:
      0 0 0px 2px #fff,
      0 0 0px 4px ${(props) => props.theme.colors.highlight};
  }
`;

const pillButtonBlueStyles = css`
  background: #1976d2;
  border-color: transparent;
  color: #fff;

  svg {
    fill: #fff;
  }

  &:active {
    opacity: 0.8;
  }
  &:focus {
    box-shadow:
      0 0 0px 2px #fff,
      0 0 0px 4px #1976d2;
  }
`;

// #endregion

// #region DropdownButton

interface StyledDropdownMenuProps {
  readonly $menuDirection?: "left" | "right";
}

export const StyledDropdownMenu = styled.div<StyledDropdownMenuProps>`
  position: absolute;
  margin-top: 2px;
  z-index: 10001;
  left: 0;

  ${(props) =>
    props.$menuDirection === "right"
      ? css`
          left: auto;
          right: 0;
        `
      : ""}
`;

export const StyledDropdownSubMenu = styled.div<StyledDropdownMenuProps>`
  position: absolute;
  margin-top: 2px;
  z-index: 10001;
  background: blue;
  height: 10px;
  right: 0;

  ${(props) =>
    props.$menuDirection === "right"
      ? css`
          left: auto;
          right: 0;
        `
      : ""}
`;

export const StyledDropdownButton = styled.div`
  position: relative;
  flex-shrink: 0;
  [aria-expanded="false"] + ${StyledDropdownMenu} {
    display: none;
  }
`;

interface StyledDropdownArrowProps {
  $openUpwards?: boolean;
}

export const StyledDropdownArrow = styled.div<StyledDropdownArrowProps>`
  margin-right: -5px;
  margin-top: -1px;
  min-width: 8px;
  &:not(:first-child) {
    padding-left: 5px;
  }
  &&&& > svg {
    height: 8px;

    ${(props) =>
      props.$openUpwards
        ? css`
            transform: rotate(180deg);
          `
        : ""}
  }
`;

export const StyledInlineDropdownWrapper = styled.div`
  display: inline-flex;
  pointer-events: all;
  margin: -6px 3px;

  ${StyledButton} {
    opacity: 0.5;
    padding: 1px;
    min-width: 0;
    height: 18px;

    &:hover {
      opacity: 1;
    }
  }
`;

// #endregion
