import { ReactNode } from "react";
import PropTypes from "prop-types";
import styled, { css } from "styled-components";
import { ThemeInterface } from "../theme/ThemeInterface";

export interface ButtonProps {
  readonly size?: "small" | "medium" | "large";
  readonly variant?: "normal" | "primary" | "transparent";
  readonly children?: ReactNode;
  readonly theme?: ThemeInterface;
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: ${props => props.theme.typography.fontSize};
  border-radius: ${props => props.theme.borderRadius}px;
  height: 28px;
  min-width: 24px;
  white-space: nowrap;
  padding: 0px 15px;
  box-sizing: border-box;
  font-weight: normal;
  border-width: 1px;
  overflow: hidden;

  svg {
    max-width: 100%;
    max-height: 100%;
    fill: ${props => props.theme.colors.button.text};
  }

  ${props => (props.size === "small" ? smallStyles : "")}
  ${props => (props.size === "large" ? largeStyles : "")}
  ${props => (props.variant === "normal" ? normalStyles : "")}
  ${props => (props.variant === "primary" ? primaryStyles : "")}
  ${props => (props.variant === "transparent" ? transparentStyles : "")}
`;

const smallStyles = css`
  font-size: 9px;
  padding: 6px;
  height: 22px;
`;

const largeStyles = css`
  height: 42px;
  padding: 0px 20px;
  font-size: 15px;
  font-weight: bold;
`;

const normalStyles = css`
  background: ${props => props.theme.colors.button.background};
  border: 1px solid ${props => props.theme.colors.button.border};
  border-top: 1px solid ${props => props.theme.colors.button.borderTop};
  color: ${props => props.theme.colors.button.text};

  :active {
    background: ${props => props.theme.colors.button.activeBackground};
  }
`;

const primaryStyles = css`
  background: ${props => props.theme.colors.highlight};
  border-color: transparent;
  color: #fff;

  svg {
    fill: #fff;
  }

  :active {
    background: #fff;
    color: ${props => props.theme.colors.highlight};
  }
  :focus {
    box-shadow: 0 0 0px 2px #fff, 0 0 0px 4px ${props => props.theme.colors.highlight};
  }
`;

const transparentStyles = css`
  background: transparent;
  border-color: transparent;

  :hover {
    background: rgba(128, 128, 128, 0.3);
  }
  :active {
    background: rgba(128, 128, 128, 0.4);
  }
`;

Button.defaultProps = {
  variant: "normal",
  size: "medium",
};

Button.propTypes = {
  variant: PropTypes.oneOf(["normal", "primary", "transparent"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
};
