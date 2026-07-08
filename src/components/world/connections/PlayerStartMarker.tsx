import { MIDDLE_MOUSE, TILE_SIZE } from "consts";
import React, { memo, useCallback } from "react";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import styled, { css } from "styled-components";
import {
  useAppDispatch,
  useAppSelector,
  useAppSelectorPick,
} from "store/hooks";
import { ActorDirection } from "shared/lib/resources/types";
import { TriangleIcon } from "ui/icons/Icons";

interface PlayerStartMarkerProps {
  editable: boolean;
}

interface SceneStartMarkerProps {
  sceneId: string;
  editable: boolean;
}

interface MarkerProps {
  $direction: ActorDirection | undefined;
  $isDragging: boolean;
}

const Marker = styled.div<MarkerProps>`
  position: absolute;
  z-index: 12;
  width: 16px;
  height: 8px;
  border-radius: 16px;
  background-color: rgb(255, 87, 34);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    outline: 2px solid rgb(255, 87, 34);
    z-index: 50;
  }

  svg {
    width: 6px;
    height: 6px;
    fill: #fff;

    ${(props) =>
      props.$direction === "right" &&
      css`
        transform: translateX(1px) rotate(90deg);
      `}
    ${(props) =>
      props.$direction === "left" &&
      css`
        transform: translateX(-1px) rotate(-90deg);
      `}
    ${(props) =>
      props.$direction === "down" &&
      css`
        transform: rotate(180deg);
      `}
  }

  ${(props) =>
    props.$isDragging &&
    css`
      pointer-events: none;
    `}
`;

const SceneStartMarker = memo(
  ({ sceneId, editable }: SceneStartMarkerProps) => {
    const dispatch = useAppDispatch();

    const startX = useAppSelector(
      (state) => state.project.present.settings.startX,
    );
    const startY = useAppSelector(
      (state) => state.project.present.settings.startY,
    );
    const startDirection = useAppSelector(
      (state) => state.project.present.settings.startDirection,
    );
    const scene = useAppSelectorPick(
      (state) => sceneSelectors.selectById(state, sceneId),
      ["x", "y"],
    );
    const isDragging = useAppSelector((state) => !!state.editor.dragging);

    const onDragPlayerStart = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (editable && e.nativeEvent.button !== MIDDLE_MOUSE) {
          e.stopPropagation();
          e.preventDefault();
          dispatch(editorActions.dragPlayerStart());
        }
      },
      [dispatch, editable],
    );

    const startX2 = scene && scene.x + (startX || 0) * TILE_SIZE;
    const startY2 = scene && 20 + scene.y + (startY || 0) * TILE_SIZE;

    if (!scene) {
      return null;
    }

    return (
      <Marker
        style={{
          left: startX2,
          top: startY2,
        }}
        $direction={startDirection}
        $isDragging={isDragging}
        onMouseDown={onDragPlayerStart}
      >
        <TriangleIcon />
      </Marker>
    );
  },
);

const PlayerStartMarker = memo(({ editable }: PlayerStartMarkerProps) => {
  const sceneId = useAppSelector((state) => {
    const startSceneId = state.project.present.settings.startSceneId;

    if (sceneSelectors.selectById(state, startSceneId)) {
      return startSceneId;
    }

    return sceneSelectors.selectIds(state)[0] ?? "";
  });

  if (!sceneId) {
    return null;
  }

  return <SceneStartMarker sceneId={sceneId} editable={editable} />;
});

export default PlayerStartMarker;
