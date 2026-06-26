import React, { memo, useCallback } from "react";
import editorActions from "store/features/editor/editorActions";
import { triggerSelectors } from "store/features/entities/entitiesSelectors";
import { MIDDLE_MOUSE, TILE_SIZE } from "consts";
import styled, { css } from "styled-components";
import { useAppDispatch, useAppSelector } from "store/hooks";
import renderTriggerContextMenu from "components/world/contextMenus/renderTriggerContextMenu";
import { useContextMenu } from "ui/hooks/use-context-menu";
import { getDragOffset } from "components/world/entities/scenes/cursor/getDragOffset";

interface TriggerViewProps {
  id: string;
  sceneId: string;
  editable?: boolean;
}

interface WrapperProps {
  $selected?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: rgba(255, 120, 0, 0.5);
  outline: 1px solid rgba(255, 120, 0, 1);
  -webkit-transform: translate3d(0, 0, 0);

  ${(props) =>
    props.$selected
      ? css`
          background-color: rgba(255, 199, 40, 0.9);
        `
      : ""}
`;

const TriggerView = memo(({ id, sceneId, editable }: TriggerViewProps) => {
  const dispatch = useAppDispatch();
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, id),
  );
  const selected = useAppSelector(
    (state) =>
      state.editor.type === "trigger" &&
      state.editor.scene === sceneId &&
      state.editor.entityId === id,
  );
  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (editable && e.nativeEvent.which !== MIDDLE_MOUSE) {
        const offset = getDragOffset(e.currentTarget, e.clientX, e.clientY);
        dispatch(
          editorActions.dragTriggerStart({
            sceneId,
            triggerId: id,
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
    return renderTriggerContextMenu({
      dispatch,
      triggerId: id,
      sceneId,
    });
  }, [dispatch, id, sceneId]);

  const { onContextMenu, contextMenuElement } = useContextMenu({
    getMenu: getContextMenu,
  });

  //#endregion Context Menu

  if (!trigger) {
    return <></>;
  }

  return (
    <Wrapper
      $selected={selected}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      style={{
        left: trigger.x * TILE_SIZE,
        top: trigger.y * TILE_SIZE,
        width: Math.max(trigger.width, 1) * TILE_SIZE,
        height: Math.max(trigger.height, 1) * TILE_SIZE,
      }}
    >
      {contextMenuElement}
    </Wrapper>
  );
});

export default TriggerView;
