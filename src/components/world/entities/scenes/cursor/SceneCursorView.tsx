import React from "react";
import styled, { css } from "styled-components";

export type SceneCursorViewVariant =
  | "default"
  | "actors"
  | "triggers"
  | "eraser"
  | "collisions"
  | "colors"
  | "tiles"
  | "selection";

export interface SceneCursorViewModel {
  variant: SceneCursorViewVariant;
  width: number;
  height: number;
  bubble?: React.ReactNode;
}

interface WrapperProps {
  $variant: SceneCursorViewVariant;
  $width: number;
  $height: number;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  width: ${(props) => props.$width}px;
  height: ${(props) => props.$height}px;
  top: 0px;
  left: 0px;
  transform: translate3d(0, 0, 0);
  outline: 1px solid rgb(140, 150, 156);
  background: rgba(140, 150, 156, 0.4);
  -webkit-transform: translate3d(0, 0, 0);
  z-index: 200;

  &:after {
    content: "";
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    background: transparent;
  }

  ${(props) =>
    props.$variant === "actors"
      ? css`
          background-color: rgba(247, 45, 220, 0.5);
          outline: 1px solid rgba(140, 0, 177, 0.8);
        `
      : ""}

  ${(props) =>
    props.$variant === "triggers"
      ? css`
          background-color: rgba(255, 120, 0, 0.5);
          outline: 1px solid rgba(255, 120, 0, 1);
        `
      : ""}

  ${(props) =>
    props.$variant === "eraser"
      ? css`
          background-color: rgba(255, 0, 0, 0.8);
          outline: 1px solid rgba(255, 0, 0, 1);
        `
      : ""}

  ${(props) =>
    props.$variant === "collisions"
      ? css`
          background-color: rgba(250, 40, 40, 0.6);
          outline: 1px solid rgba(250, 40, 40, 0.8);
        `
      : ""}

  ${(props) =>
    props.$variant === "tiles"
      ? css`
          background-color: rgba(0, 170, 255, 0.35);
        `
      : ""}

  ${(props) =>
    props.$variant === "colors"
      ? css`
          background-color: transparent;
        `
      : ""}

  ${(props) =>
    props.$variant === "selection"
      ? css`
          background-color: transparent;
        `
      : ""}
`;

const Bubble = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 8px;
  font-weight: bold;
  background: ${(props) => props.theme.colors.highlight};
  border-radius: 8px;
  line-height: 12px;
  text-align: center;
  top: -12px;
  left: -14px;
  box-shadow: 1px 1px 1px 1px rgba(0, 0, 0, 0.2);

  svg {
    fill: #fff;
    width: 8px;
  }
`;

interface SceneCursorViewProps {
  x: number;
  y: number;
  view: SceneCursorViewModel;
}

export const SceneCursorView = React.forwardRef<
  HTMLDivElement,
  SceneCursorViewProps
>(({ x, y, view }, cursorRef) => {
  return (
    <Wrapper
      ref={cursorRef}
      $variant={view.variant}
      $width={view.width}
      $height={view.height}
      style={{
        pointerEvents: "none",
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
    >
      {view.bubble && <Bubble>{view.bubble}</Bubble>}
    </Wrapper>
  );
});

SceneCursorView.displayName = "SceneCursorView";
