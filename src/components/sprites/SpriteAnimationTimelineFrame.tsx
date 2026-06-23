import * as React from "react";
import styled, { css } from "styled-components";
import { MetaspriteCanvas } from "components/rendering/MetaspriteCanvas";
import renderSpriteFrameContextMenu from "components/sprites/contextMenus/renderSpriteFrameContextMenu";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { useCallback } from "react";
import { pasteAny } from "store/features/clipboard/clipboardHelpers";
import { useContextMenu } from "ui/hooks/use-context-menu";

interface CardWrapperProps {
  $selected: boolean;
  $multiSelected: boolean;
  $isDragging?: boolean;
}

const CardWrapper = styled.div<CardWrapperProps>`
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
    (state) => state.editor.selectedAdditionalMetaspriteIds,
  );

  //#region Context Menu

  const getContextMenu = useCallback(async () => {
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
    animationId,
    dispatch,
    id,
    selectedAdditionalMetaspriteIds,
    spriteSheetId,
  ]);

  const { onContextMenu, contextMenuElement } = useContextMenu({
    getMenu: getContextMenu,
  });

  //#endregion Context Menu

  return (
    <CardWrapper
      $selected={selected}
      $multiSelected={multiSelected}
      $isDragging={isDragging}
      onContextMenu={onContextMenu}
    >
      <MetaspriteCanvas metaspriteId={id} spriteSheetId={spriteSheetId} />
      <FrameIndex>{index}</FrameIndex>
      {contextMenuElement}
    </CardWrapper>
  );
};
