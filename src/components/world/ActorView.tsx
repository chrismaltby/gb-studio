import React, { memo, useCallback, useEffect, useState } from "react";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { MIDDLE_MOUSE, TILE_SIZE } from "consts";
import { actorSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import styled, { css } from "styled-components";
import { Palette } from "shared/lib/entities/entitiesTypes";
import { useAppDispatch, useAppSelector } from "store/hooks";
import renderActorContextMenu from "./renderActorContextMenu";
import { ContextMenu } from "ui/menu/ContextMenu";

interface ActorViewProps {
  id: string;
  sceneId: string;
  palettes?: Palette[];
  editable?: boolean;
}

interface WrapperProps {
  selected?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  width: 16px;
  height: 8px;
  background-color: rgba(247, 45, 220, 0.5);
  outline: 1px solid rgba(140, 0, 177, 0.8);
  -webkit-transform: translate3d(0, 0, 0);

  ${(props) =>
    props.selected
      ? css`
          background-color: rgba(247, 45, 220, 0.8);
          outline: 1px solid rgba(140, 0, 177, 1);
          z-index: 100;
        `
      : ""}
`;

const PinScreenPreview = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 160px;
  height: 144px;
  pointer-events: none;
  z-index: 100;
  outline: 2000px solid rgba(0, 0, 0, 0.5);
`;

const CanvasWrapper = styled.div`
  pointer-events: none;
`;

const ActorView = memo(
  ({ id, sceneId, palettes, editable }: ActorViewProps) => {
    const dispatch = useAppDispatch();
    const actor = useAppSelector((state) =>
      actorSelectors.selectById(state, id)
    );
    const selected = useAppSelector(
      (state) =>
        state.editor.type === "actor" &&
        state.editor.scene === sceneId &&
        state.editor.entityId === id
    );
    const isDragging = useAppSelector(
      (state) => selected && state.editor.dragging
    );
    const showSprite = useAppSelector((state) => state.editor.zoom > 80);
    const previewAsMono = useAppSelector(
      (state) =>
        state.project.present.settings.colorMode === "mono" ||
        (state.project.present.settings.colorMode === "mixed" &&
          state.project.present.settings.previewAsMono)
    );

    const onMouseUp = useCallback(() => {
      dispatch(editorActions.dragActorStop());
      window.removeEventListener("mouseup", onMouseUp);
    }, [dispatch]);

    const onMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (editable && e.nativeEvent.which !== MIDDLE_MOUSE) {
          dispatch(editorActions.dragActorStart({ sceneId, actorId: id }));
          dispatch(editorActions.setTool({ tool: "select" }));
          window.addEventListener("mouseup", onMouseUp);
        }
      },
      [dispatch, editable, id, onMouseUp, sceneId]
    );

    useEffect(() => {
      if (isDragging) {
        window.addEventListener("mouseup", onMouseUp);
      }
      return () => {
        window.removeEventListener("mouseup", onMouseUp);
      };
    }, [onMouseUp, isDragging]);

    const [contextMenu, setContextMenu] =
      useState<{
        x: number;
        y: number;
        menu: JSX.Element[];
      }>();

    const renderContextMenu = useCallback(() => {
      return renderActorContextMenu({
        dispatch,
        actorId: id,
        sceneId,
      });
    }, [dispatch, id, sceneId]);

    const onContextMenu = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        const menu = renderContextMenu();
        if (!menu) {
          return;
        }
        setContextMenu({ x: e.pageX, y: e.pageY, menu });
      },
      [renderContextMenu]
    );

    const onContextMenuClose = useCallback(() => {
      setContextMenu(undefined);
    }, []);

    if (!actor) {
      return <></>;
    }

    return (
      <>
        {selected && actor.isPinned && <PinScreenPreview />}
        <Wrapper
          selected={selected}
          onMouseDown={onMouseDown}
          onContextMenu={onContextMenu}
          style={{
            left: actor.x * TILE_SIZE,
            top: actor.y * TILE_SIZE,
          }}
        >
          {showSprite && (
            <CanvasWrapper>
              <SpriteSheetCanvas
                spriteSheetId={actor.spriteSheetId}
                direction={actor.direction}
                frame={0}
                palettes={palettes}
                previewAsMono={previewAsMono}
                offsetPosition
              />
            </CanvasWrapper>
          )}
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={onContextMenuClose}
            >
              {contextMenu.menu}
            </ContextMenu>
          )}
        </Wrapper>
      </>
    );
  }
);

export default ActorView;
