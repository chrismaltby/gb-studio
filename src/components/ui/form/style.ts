import styled, { css } from "styled-components";

// extends React.InputHTMLAttributes<HTMLInputElement>

interface StyledInputProps {
  readonly $displaySize?: "small" | "medium" | "large";
}

export const StyledInput = styled.input<StyledInputProps>`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 5px;
  box-sizing: border-box;
  width: 100%;
  height: 28px;

  &:hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  &:focus {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
  }

  &:disabled {
    opacity: 0.5;
  }

  &:read-only {
    background: ${(props) => props.theme.colors.input.border};
    pointer-events: none;
  }

  ${(props) => (props.$displaySize === "small" ? smallStyles : "")}
  ${(props) => (props.$displaySize === "large" ? largeStyles : "")}
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

// #region Textarea

interface StyledTextareaProps {
  readonly $displaySize?: "small" | "medium" | "large";
}

export const StyledTextarea = styled.textarea<StyledTextareaProps>`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border: 1px solid ${(props) => props.theme.colors.input.border};
  font-size: ${(props) => props.theme.typography.fontSize};
  border-radius: ${(props) => props.theme.borderRadius}px;
  padding: 5px;
  box-sizing: border-box;
  width: 100%;
  resize: none;

  &:hover {
    background: ${(props) => props.theme.colors.input.hoverBackground};
  }

  &:focus {
    border: 1px solid ${(props) => props.theme.colors.highlight};
    background: ${(props) => props.theme.colors.input.activeBackground};
  }

  ${(props) => (props.$displaySize === "small" ? textareaSmallStyles : "")}
  ${(props) => (props.$displaySize === "large" ? textareaLargeStyles : "")}
`;

const textareaSmallStyles = css`
  font-size: 9px;
  padding: 6px;
`;

const textareaLargeStyles = css`
  padding: 20px 10px;
  font-size: 14px;
`;

// #endregion Textarea
