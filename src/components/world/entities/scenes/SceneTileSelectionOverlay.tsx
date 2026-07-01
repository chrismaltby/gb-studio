import React from "react";
import styled from "styled-components";
import { useAppSelector } from "store/hooks";
import {
  TOOL_COLLISIONS,
  TOOL_COLORS,
  TOOL_TILES,
  BRUSH_SELECTION,
  TILE_SIZE,
} from "consts";

interface SceneTileSelectionOverlayProps {
  sceneId: string;
}

const TileSelectionOutline = styled.div`
  position: absolute;
  z-index: 90;
  box-sizing: border-box;
  border: 1px solid ${(props) => props.theme.colors.highlightText};
  outline: 1px solid ${(props) => props.theme.colors.highlight};
  pointer-events: none;
`;

export const SceneTileSelectionOverlay = ({
  sceneId,
}: SceneTileSelectionOverlayProps) => {
  const tool = useAppSelector((state) => state.editor.tool);
  const selectedBrush = useAppSelector((state) => state.editor.selectedBrush);

  const scenePaintSelection = useAppSelector((state) => {
    const selection = state.editor.scenePaintSelection;
    return selection?.sceneId === sceneId ? selection : undefined;
  });

  const scenePaintSelectionMode =
    tool === TOOL_TILES
      ? "tiles"
      : tool === TOOL_COLLISIONS
        ? "collisions"
        : tool === TOOL_COLORS
          ? "colors"
          : undefined;

  const activeScenePaintSelection =
    scenePaintSelection?.mode === scenePaintSelectionMode
      ? scenePaintSelection
      : undefined;

  if (selectedBrush !== BRUSH_SELECTION || !activeScenePaintSelection) {
    return null;
  }

  return (
    <TileSelectionOutline
      style={{
        left:
          (activeScenePaintSelection.selection.x +
            activeScenePaintSelection.offset.x) *
          TILE_SIZE,
        top:
          (activeScenePaintSelection.selection.y +
            activeScenePaintSelection.offset.y) *
          TILE_SIZE,
        width: activeScenePaintSelection.selection.width * TILE_SIZE,
        height: activeScenePaintSelection.selection.height * TILE_SIZE,
      }}
    />
  );
};
