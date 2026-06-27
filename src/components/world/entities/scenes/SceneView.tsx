import React, { memo, useCallback, useMemo } from "react";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  TOOL_SELECT,
  TILE_SIZE,
} from "consts";
import SceneInfo from "./SceneInfo";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import { SceneEventHelper } from "./SceneEventHelper";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import styled, { css } from "styled-components";
import { LabelSpan } from "ui/buttons/LabelButton";
import {
  useAppDispatch,
  useAppSelector,
  useAppSelectorPick,
  useAppStore,
} from "store/hooks";
import renderSceneContextMenu from "components/world/contextMenus/renderSceneContextMenu";
import SceneScrollBounds from "./SceneScrollBounds";
import SceneScreenGrid from "components/world/entities/scenes/SceneScreenGrid";
import { useContextMenu } from "ui/hooks/use-context-menu";
import { SceneParallaxOverlay } from "components/world/entities/scenes/SceneParallaxOverlay";
import { SceneTitle } from "components/world/entities/scenes/SceneTitle";
import { useWorldEntityDrag } from "components/world/hooks/useWorldEntityDrag";
import { useRectVisibleInWorldViewport } from "components/world/hooks/useRectVisibleInWorldViewport";
import { SceneTileLayers } from "components/world/entities/scenes/SceneTileLayers";
import { SceneEntities } from "components/world/entities/scenes/SceneEntities";
import { SceneTileSelectionOverlay } from "components/world/entities/scenes/SceneTileSelectionOverlay";
import { SceneTypeDisabledOverlay } from "components/world/entities/scenes/SceneTypeDisabledOverlay";

const SCENE_LABEL_MARGIN = 50;

interface SceneViewProps {
  id: string;
  index: number;
  editable?: boolean;
}

const SceneName = styled.div`
  white-space: nowrap;
  font-size: 11px;
  background-color: ${(props) => props.theme.colors.background};
  border-radius: 32px;
  transition: background 0.3s ease-in-out;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SceneContent = styled.div`
  position: relative;
  background-color: ${(props) => props.theme.colors.sidebar.background};
  outline: 1px solid ${(props) => props.theme.colors.sidebar.border};
  image-rendering: pixelated;
  overflow: hidden;
`;

interface WrapperProps {
  $selected?: boolean;
  $multiSelected?: boolean;
  $filtered?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  user-select: none;
  text-align: center;
  border-radius: 4px;
  transition: background 0.3s ease-in-out;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;

  &:hover,
  &:hover ${SceneName} {
    background-color: ${(props) => props.theme.colors.sidebar.background};
  }

  ${(props) =>
    props.$multiSelected
      ? css`
          z-index: 10;
          background-color: ${(props) => props.theme.colors.sidebar.background};

          ${SceneContent} {
            box-shadow: 0 0 0px 2px ${(props) => props.theme.colors.highlight};
          }

          ${SceneName} {
            background-color: ${(props) =>
              props.theme.colors.sidebar.background};
          }

          ${LabelSpan} {
            opacity: 1;
          }

          .Scene__Info,
          .Scene:hover .Scene__Info {
            opacity: 1;
          }
        `
      : ""}

  ${(props) =>
    props.$selected
      ? css`
          z-index: 10;
          background-color: ${(props) => props.theme.colors.sidebar.background};

          ${SceneContent} {
            box-shadow: 0 0 0px 4px ${(props) => props.theme.colors.highlight};
          }

          ${SceneName} {
            background-color: ${(props) =>
              props.theme.colors.sidebar.background};
          }

          ${LabelSpan} {
            opacity: 1;
          }

          .Scene__Info,
          .Scene:hover .Scene__Info {
            opacity: 1;
          }
        `
      : ""}

  ${(props) =>
    props.$filtered
      ? css`
          &:after {
            content: "";
            background-color: ${(props) => props.theme.colors.background};
            border-radius: 4px;
            opacity: 0.8;
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            pointer-events: none;
          }
        `
      : ""}
`;

interface SceneOverlayProps {
  $noPointerEvents?: boolean;
}

const SceneOverlay = styled.div<SceneOverlayProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  ${(props) =>
    props.$noPointerEvents
      ? css`
          pointer-events: none;
        `
      : ""}
`;

const SceneView = memo(({ id, index, editable }: SceneViewProps) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const scene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, id),
    ["name", "x", "y", "width", "height", "scrollBounds"],
  );

  const selected = useAppSelector((state) => state.editor.scene === id);
  const sceneSelectionIds = useAppSelector(
    (state) => state.editor.sceneSelectionIds,
  );
  const multiSelected = sceneSelectionIds.includes(id);

  const searchTerm = useAppSelector((state) => state.editor.searchTerm);
  const name = useMemo(
    () => (scene ? sceneName(scene, index) : ""),
    [index, scene],
  );

  const sceneFiltered =
    (searchTerm &&
      name.toUpperCase().indexOf(searchTerm.toUpperCase()) === -1 &&
      id !== searchTerm) ||
    (sceneSelectionIds.length > 1 && !multiSelected) ||
    false;

  const tool = useAppSelector((state) => state.editor.tool);

  const showLayers = useAppSelector((state) => state.editor.showLayers);

  const showEntities =
    (tool !== TOOL_COLORS &&
      tool !== TOOL_COLLISIONS &&
      tool !== TOOL_ERASER) ||
    showLayers;
  const showSceneScreenGrid = useAppSelector(
    (state) => state.project.present.settings.showSceneScreenGrid,
  );

  const visible = useRectVisibleInWorldViewport({
    x: scene?.x ?? 0,
    y: scene?.y ?? 0,
    width: (scene?.width ?? 0) * TILE_SIZE,
    height: (scene?.height ?? 0) * TILE_SIZE + SCENE_LABEL_MARGIN,
  });

  const onSelect = useCallback(() => {
    dispatch(editorActions.selectScene({ sceneId: id }));
  }, [dispatch, id]);

  const { onStartDrag } = useWorldEntityDrag({
    entityId: id,
    editable,
    x: scene?.x ?? 0,
    y: scene?.y ?? 0,
    onSelect,
  });

  //#region Context Menu

  const getContextMenu = useCallback(
    ({ closeMenu: onClose }: { closeMenu: () => void }) => {
      const state = store.getState();
      const scene = sceneSelectors.selectById(state, id);

      if (!scene) {
        return undefined;
      }

      const { x: hoverX, y: hoverY } = state.editor.hover;

      return renderSceneContextMenu({
        dispatch,
        sceneId: id,
        additionalSceneIds: state.editor.sceneSelectionIds,
        startSceneId: state.project.present.settings.startSceneId,
        startDirection: state.project.present.settings.startDirection,
        hoverX,
        hoverY,
        colorsEnabled: state.project.present.settings.colorMode !== "mono",
        colorModeOverride: scene.colorModeOverride,
        runSceneSelectionOnly:
          state.project.present.settings.runSceneSelectionOnly,
        onClose,
      });
    },
    [dispatch, id, store],
  );

  const getContextMenuEnabled = useCallback(() => {
    return tool === TOOL_SELECT;
  }, [tool]);

  const { onContextMenu, contextMenuElement } = useContextMenu({
    getMenu: getContextMenu,
    getIsEnabled: getContextMenuEnabled,
  });

  //#endregion Context Menu

  const onToggleSelection = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        dispatch(editorActions.toggleSceneSelectedId(id));
      }
    },
    [dispatch, id],
  );

  if (!scene || !visible) {
    return <></>;
  }

  const scenePxWidth = scene.width * TILE_SIZE;
  const scenePxHeight = scene.height * TILE_SIZE;

  return (
    <Wrapper
      $selected={selected}
      $multiSelected={multiSelected}
      $filtered={sceneFiltered}
      style={{
        left: scene.x,
        top: scene.y,
      }}
      onContextMenu={onContextMenu}
      onMouseDownCapture={onToggleSelection}
    >
      <div onMouseDown={onStartDrag}>
        <SceneTitle sceneId={id} sceneIndex={index} />
      </div>
      <SceneContent
        data-scene-content-id={id}
        style={{
          width: scenePxWidth,
          height: scenePxHeight,
        }}
      >
        <SceneTileLayers sceneId={id} />
        {scene.scrollBounds && showLayers && (
          <SceneOverlay $noPointerEvents>
            <SceneScrollBounds
              width={scene.width}
              height={scene.height}
              scrollBounds={scene.scrollBounds}
            />
          </SceneOverlay>
        )}
        {showSceneScreenGrid && selected && (
          <SceneOverlay $noPointerEvents>
            <SceneScreenGrid
              width={scene.width}
              height={scene.height}
              scrollBounds={scene.scrollBounds}
            />
          </SceneOverlay>
        )}
        {selected && <SceneParallaxOverlay sceneId={id} />}
        <SceneTypeDisabledOverlay sceneId={id} />
        {selected && <SceneTileSelectionOverlay sceneId={id} />}
        {showEntities && <SceneEntities sceneId={id} editable={editable} />}
        {selected && (
          <SceneOverlay $noPointerEvents>
            <SceneEventHelper sceneId={id} />
          </SceneOverlay>
        )}
      </SceneContent>
      {selected && (
        <div onMouseDown={onStartDrag}>
          <SceneInfo sceneId={id} />
        </div>
      )}
      {contextMenuElement}
    </Wrapper>
  );
});

export default SceneView;
