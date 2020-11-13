import { Dictionary } from "@reduxjs/toolkit";
import styled, { css } from "styled-components";

interface LabelButtonProps {
  color?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const colors: Dictionary<string> = {
  red: "#e20e2b",
  orange: "#ff5722",
  yellow: "#ffc107",
  green: "#4caf50",
  blue: "#03a9f4",
  purple: "#9c27b0",
  gray: "#9e9e9e",
};

export const LabelButton = styled.button.attrs<LabelButtonProps>((props) => ({
  style: {
    backgroundColor: colors[props.color || ""],
    border: `2px solid ${colors[props.color || ""] || props.theme.colors.text}`,
  },
  title: props.color,
}))`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 20px;
  background-color: transparent;
  opacity: 0.9;

  ${(props) =>
    props.onClick
      ? css`
          :hover {
            opacity: 1;
            transform: scale(1.25);
          }
        `
      : ""}
`;
