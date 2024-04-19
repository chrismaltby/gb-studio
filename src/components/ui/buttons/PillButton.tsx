import styled, { css } from "styled-components";

export interface PillButtonProps {
  readonly variant?: "normal" | "primary";
}

export const PillButton = styled.button<PillButtonProps>`
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: ${(props) => props.theme.typography.fontSize};

  :active {
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }

  ${(props) => (props.variant === "primary" ? primaryStyles : "")}
`;

const primaryStyles = css`
  background: ${(props) => props.theme.colors.highlight};
  border-color: transparent;
  color: #fff;

  svg {
    fill: #fff;
  }

  :active {
    opacity: 0.8;
  }
  :focus {
    box-shadow: 0 0 0px 2px #fff,
      0 0 0px 4px ${(props) => props.theme.colors.highlight};
  }
`;
