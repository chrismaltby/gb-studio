import React from "react";
import styled, { css } from "styled-components";

export interface InputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  readonly displaySize?: "small" | "medium" | "large";
}

export const Input = styled.input<InputProps>`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 5px;
  box-sizing: border-box;
  width: 100%;
  height: 28px;

  :hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  :focus {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
  }

  :disabled {
    opacity: 0.5;
  }

  ${(props) => (props.displaySize === "small" ? smallStyles : "")}
  ${(props) => (props.displaySize === "large" ? largeStyles : "")}
`;

const smallStyles = css`
  font-size: 10px;
  padding: 6px;
  height: 22px;
`;

const largeStyles = css`
  padding: 20px 10px;
  font-size: 14px;
`;
