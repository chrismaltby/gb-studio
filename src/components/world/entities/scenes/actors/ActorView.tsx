import React, { memo, useCallback } from "react";
import SpriteSheetCanvas from "components/rendering/SpriteSheetCanvas";
import { MIDDLE_MOUSE, TILE_SIZE, TOOL_COLLISIONS } from "consts";
import {
  actorPrefabSelectors,
  actorSelectors,
  spriteSheetSelectors,
} from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import styled, { css } from "styled-components";
import { useAppDispatch, useAppSelector } from "store/hooks";
import renderActorContextMenu from "components/world/contextMenus/renderActorContextMenu";
import { SpriteBoundingBox } from "components/sprites/MetaspriteEditor";
import { MonoOBJPalette, Palette } from "shared/lib/resources/types";
import { useContextMenu } from "ui/hooks/use-context-menu";
import { getDragOffset } from "components/world/entities/scenes/cursor/getDragOffset";

interface ActorViewProps {
  id: string;
  sceneId: string;
  palettes?: Palette[];
  monoPalettes?: [MonoOBJPalette, MonoOBJPalette];
  editable?: boolean;
}

interface WrapperProps {
  $selected?: boolean;
  $halfWidth: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  height: 8px;
  background-color: rgba(247, 45, 220, 0.5);
  outline: 1px solid rgba(140, 0, 177, 0.8);
  -webkit-transform: translate3d(0, 0, 0);

  ${(props) =>
    props.$halfWidth
      ? css`
          width: 8px;
        `
      : css`
          width: 16px;
        `}

  ${(props) =>
    props.$selected
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
  ({ id, sceneId, palettes, monoPalettes, editable }: ActorViewProps) => {
    const dispatch = useAppDispatch();

    const actor = useAppSelector((state) =>
      actorSelectors.selectById(state, id),
    );
    const prefab = useAppSelector((state) =>
      actorPrefabSelectors.selectById(state, actor?.prefabId ?? ""),
    );

    const sprite = useAppSelector((state) =>
      spriteSheetSelectors.selectById(
        state,
        prefab?.spriteSheetId ?? actor?.spriteSheetId ?? "",
      ),
    );
    const selected = useAppSelector(
      (state) =>
        state.editor.type === "actor" &&
        state.editor.scene === sceneId &&
        state.editor.entityId === id,
    );
    const showSprite = useAppSelector((state) => state.editor.zoom > 80);
    const previewAsMono = useAppSelector(
      (state) =>
        state.project.present.settings.colorMode === "mono" ||
        (state.project.present.settings.colorMode === "mixed" &&
          state.project.present.settings.previewAsMono),
    );
    const boundsWidth = sprite?.boundsWidth || 16;
    const boundsHeight = sprite?.boundsHeight || 16;
    const boundsX = sprite?.boundsX || 0;
    const boundsY = sprite?.boundsY || 0;
    const showBoundingBox = useAppSelector(
      (state) => state.editor.tool === TOOL_COLLISIONS,
    );

    const onMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (editable && e.nativeEvent.which !== MIDDLE_MOUSE) {
          const offset = getDragOffset(e.currentTarget, e.clientX, e.clientY);
          dispatch(
            editorActions.dragActorStart({
              sceneId,
              actorId: id,
              offsetX: offset.x,
              offsetY: offset.y,
            }),
          );
          dispatch(editorActions.setTool({ tool: "select" }));
        }
      },
      [dispatch, editable, id, sceneId],
    );

    //#region Context Menu

    const getContextMenu = useCallback(() => {
      return renderActorContextMenu({
        dispatch,
        actorId: id,
        sceneId,
      });
    }, [dispatch, id, sceneId]);

    const { onContextMenu, contextMenuElement } = useContextMenu({
      getMenu: getContextMenu,
    });

    //#endregion Context Menu

    if (!actor) {
      return <></>;
    }

    const UNIT_SIZE = actor.coordinateType === "pixels" ? 1 : TILE_SIZE;

    return (
      <>
        {selected && actor.isPinned && <PinScreenPreview />}
        <Wrapper
          $selected={selected}
          $halfWidth={sprite?.canvasWidth === 8}
          onMouseDown={onMouseDown}
          onContextMenu={onContextMenu}
          style={{
            left: actor.x * UNIT_SIZE,
            top: actor.y * UNIT_SIZE,
          }}
        >
          {showSprite && (
            <CanvasWrapper>
              <SpriteSheetCanvas
                spriteSheetId={sprite?.id ?? ""}
                direction={actor.direction}
                frame={0}
                palettes={palettes}
                previewAsMono={previewAsMono}
                monoPalettes={monoPalettes}
                offsetPosition
              />
              {showBoundingBox && (
                <SpriteBoundingBox
                  style={{
                    left: boundsX,
                    top: boundsY,
                    width: boundsWidth,
                    height: boundsHeight,
                  }}
                />
              )}
            </CanvasWrapper>
          )}
          {contextMenuElement}
        </Wrapper>
      </>
    );
  },
);

export default ActorView;
