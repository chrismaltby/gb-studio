import React from "react";
import styled, { css } from "styled-components";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  BRUSH_16PX,
  TILE_SIZE,
  TOOL_ACTORS,
  TOOL_TRIGGERS,
} from "consts";
import { Brush, Tool } from "store/features/editor/editorState";
import {
  BrickIcon,
  CloseIcon,
  PaintIcon,
  PlusIcon,
  ResizeIcon,
} from "ui/icons/Icons";

interface WrapperProps {
  $tool: Tool;
  $size: "8px" | "16px";
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  width: 8px;
  height: 8px;
  top: 0px;
  left: 0px;
  transform: translate3d(0, 0, 0);
  outline: 1px solid rgb(140, 150, 156);
  background: rgba(140, 150, 156, 0.4);
  -webkit-transform: translate3d(0, 0, 0);

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
    props.$size === "16px"
      ? css`
          width: 16px;
          height: 16px;
        `
      : ""}

  ${(props) =>
    props.$tool === TOOL_ACTORS
      ? css`
          width: 16px;
          background-color: rgba(247, 45, 220, 0.5);
          outline: 1px solid rgba(140, 0, 177, 0.8);
          pointer-events: all;
          z-index: 200;
        `
      : ""}

  ${(props) =>
    props.$tool === TOOL_TRIGGERS
      ? css`
          background-color: rgba(255, 120, 0, 0.5);
          outline: 1px solid rgba(255, 120, 0, 1);
          pointer-events: all;
          z-index: 200;
        `
      : ""}

  ${(props) =>
    props.$tool === TOOL_ERASER
      ? css`
          background-color: rgba(255, 0, 0, 0.8);
          outline: 1px solid rgba(255, 0, 0, 1);
          pointer-events: all;
          z-index: 200;
        `
      : ""}

  ${(props) =>
    props.$tool === TOOL_COLLISIONS
      ? css`
          background-color: rgba(250, 40, 40, 0.6);
          outline: 1px solid rgba(250, 40, 40, 0.8);
          pointer-events: all;
        `
      : ""}

  ${(props) =>
    props.$tool === TOOL_COLORS
      ? css`
          background-color: transparent;
          pointer-events: all;
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
  tool: Tool;
  brush: Brush;
  x: number;
  y: number;
  isResizingTrigger: boolean;
  onMouseMove?: React.MouseEventHandler<HTMLDivElement>;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
}

const cursorSize = (tool: Tool, brush: Brush): "8px" | "16px" => {
  return (tool === TOOL_COLORS ||
    tool === TOOL_COLLISIONS ||
    tool === TOOL_ERASER) &&
    brush === BRUSH_16PX
    ? "16px"
    : "8px";
};

const shouldShowBubble = (tool: Tool) => {
  return (
    tool === TOOL_ACTORS ||
    tool === TOOL_TRIGGERS ||
    tool === TOOL_ERASER ||
    tool === TOOL_COLORS ||
    tool === TOOL_COLLISIONS
  );
};

const renderBubbleIcon = (tool: Tool, isResizingTrigger: boolean) => {
  if (tool === TOOL_ACTORS) {
    return <PlusIcon />;
  }

  if (tool === TOOL_TRIGGERS) {
    return isResizingTrigger ? <ResizeIcon /> : <PlusIcon />;
  }

  if (tool === TOOL_ERASER) {
    return <CloseIcon />;
  }

  if (tool === TOOL_COLLISIONS) {
    return <BrickIcon />;
  }

  if (tool === TOOL_COLORS) {
    return <PaintIcon />;
  }

  return null;
};

export const SceneCursorView = React.forwardRef<
  HTMLDivElement,
  SceneCursorViewProps
>(
  (
    { tool, brush, x, y, isResizingTrigger, onMouseMove, onMouseDown },
    cursorRef,
  ) => {
    return (
      <Wrapper
        ref={cursorRef}
        $tool={tool}
        $size={cursorSize(tool, brush)}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        style={{
          transform: `translate3d(${x * TILE_SIZE}px, ${y * TILE_SIZE}px, 0)`,
        }}
      >
        {shouldShowBubble(tool) && (
          <Bubble>{renderBubbleIcon(tool, isResizingTrigger)}</Bubble>
        )}
      </Wrapper>
    );
  },
);

SceneCursorView.displayName = "SceneCursorView";
