import * as React from "react";
import styled, { css } from "styled-components";
import { MetaspriteCanvas } from "./preview/MetaspriteCanvas";
import renderSpriteFrameContextMenu from "components/sprites/renderSpriteFrameContextMenu";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { useCallback, useState } from "react";
import { ContextMenu } from "ui/menu/ContextMenu";
import { pasteAny } from "store/features/clipboard/clipboardHelpers";

interface CardWrapperProps {
  $selected: boolean;
  $multiSelected: boolean;
  $isDragging?: boolean;
}

export const CardWrapper = styled.div<CardWrapperProps>`
  width: 50px;
  height: 50px;
  background-color: #ffffff;
  cursor: move;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
  box-sizing: border-box;
  position: relative;

  ${(props) =>
    props.$selected
      ? css`
          box-shadow: 0 0 0px 4px ${(props) => props.theme.colors.highlight};
        `
      : ""}

  ${(props) =>
    props.$multiSelected && !props.$selected
      ? css`
          box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight};
        `
      : ""}

  ${(props) =>
    props.$isDragging
      ? css`
          opacity: 0;
        `
      : ""}

  canvas {
    max-width: 100%;
    max-height: 100%;
  }
`;

const FrameIndex = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: ${(props) => props.theme.colors.sidebar.background};
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 4px;
`;

interface SpriteAnimationTimelineFrameProps {
  selected: boolean;
  multiSelected: boolean;
  isDragging: boolean;
  id: string;
  spriteSheetId: string;
  animationId: string;
  index: number;
}

export const SpriteAnimationTimelineFrame = ({
  selected,
  multiSelected,
  isDragging,
  id,
  spriteSheetId,
  animationId,
  index,
}: SpriteAnimationTimelineFrameProps) => {
  const dispatch = useAppDispatch();

  const selectedAdditionalMetaspriteIds = useAppSelector(
    (state) => state.editor.selectedAdditionalMetaspriteIds
  );

  const [contextMenu, setContextMenu] =
    useState<{
      x: number;
      y: number;
      menu: JSX.Element[];
    }>();

  const onContextMenuClose = useCallback(() => {
    setContextMenu(undefined);
  }, []);

  const renderContextMenu = useCallback(async () => {
    const clipboard = await pasteAny();
    return renderSpriteFrameContextMenu({
      dispatch,
      spriteSheetId,
      spriteAnimationId: animationId,
      metaspriteId: id,
      selectedMetaspriteIds: selectedAdditionalMetaspriteIds,
      clipboard,
    });
  }, [
    selectedAdditionalMetaspriteIds,
    animationId,
    dispatch,
    id,
    spriteSheetId,
  ]);

  const onContextMenu = useCallback(
    async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const menu = await renderContextMenu();
      if (!menu) {
        return;
      }
      setContextMenu({ x: e.pageX, y: e.pageY, menu });
    },
    [renderContextMenu]
  );

  return (
    <CardWrapper
      $selected={selected}
      $multiSelected={multiSelected}
      $isDragging={isDragging}
      onContextMenu={onContextMenu}
    >
      <MetaspriteCanvas metaspriteId={id} spriteSheetId={spriteSheetId} />
      <FrameIndex>{index}</FrameIndex>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={onContextMenuClose}
        >
          {contextMenu.menu}
        </ContextMenu>
      )}
    </CardWrapper>
  );
};
