import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import WorldActor from "./actors/ActorView";
import TriggerView from "./triggers/TriggerView";
import SceneCollisions from "./SceneCollisions";
import SceneCursor from "./cursor/SceneCursor";
import ColorizedImage from "components/rendering/ColorizedImage";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  DMG_PALETTE,
  MIDDLE_MOUSE,
  TILE_COLOR_PROP_PRIORITY,
  TOOL_SELECT,
  BRUSH_SELECTION,
} from "consts";
import SceneInfo from "./SceneInfo";
import {
  sceneSelectors,
  backgroundSelectors,
  paletteSelectors,
} from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import ScenePriorityMap from "./ScenePriorityMap";
import SceneSlopePreview from "./SceneSlopePreview";
import { SceneEventHelper } from "./SceneEventHelper";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import styled, { css } from "styled-components";
import { LabelSpan } from "ui/buttons/LabelButton";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import { assetURL } from "shared/lib/helpers/assets";
import AutoColorizedImage from "components/rendering/AutoColorizedImage";
import renderSceneContextMenu from "components/world/contextMenus/renderSceneContextMenu";
import SceneScrollBounds from "./SceneScrollBounds";
import { SceneContext } from "components/script/context/SceneContext";
import { WarningIcon } from "ui/icons/Icons";
import { useEnabledSceneTypeIds } from "store/features/engine/hooks/useEnabledSceneTypeIds";
import SceneScreenGrid from "components/world/entities/scenes/SceneScreenGrid";
import { MonoOBJPalette } from "shared/lib/resources/types";
import { useContextMenu } from "ui/hooks/use-context-menu";
import { moveGridSelection } from "shared/lib/tiles/gridSelection";
import { SceneParallaxOverlay } from "components/world/entities/scenes/SceneParallaxOverlay";
import { SceneTitle } from "components/world/entities/scenes/SceneTitle";

const TILE_SIZE = 8;

const dmgPalettes = [
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
];

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

const SceneErrorOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.8);
  pointer-events: none;

  svg {
    background: ${(props) => props.theme.colors.highlight};
    fill: ${(props) => props.theme.colors.highlightText};
    padding: 10px;
    border-radius: 4px;
  }
`;

const TileSelectionOutline = styled.div`
  position: absolute;
  z-index: 90;
  box-sizing: border-box;
  border: 1px solid ${(props) => props.theme.colors.highlightText};
  outline: 1px solid ${(props) => props.theme.colors.highlight};
  background: color-mix(
    in srgb,
    ${(props) => props.theme.colors.highlight} 15%,
    transparent
  );
  pointer-events: none;
`;

const SceneView = memo(({ id, index, editable }: SceneViewProps) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const scene = useAppSelector((state) => sceneSelectors.selectById(state, id));
  const defaultSpriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode,
  );
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, scene?.backgroundId ?? ""),
  );
  const tilesOverride = useAppSelector((state) =>
    background && background.monoOverrideId
      ? backgroundSelectors.selectById(state, background.monoOverrideId ?? "")
      : undefined,
  );
  const enabledSceneTypeIds = useEnabledSceneTypeIds();
  const sceneTypeEnabled = useMemo(() => {
    return enabledSceneTypeIds.includes(scene?.type);
  }, [enabledSceneTypeIds, scene?.type]);
  const startSceneId = useAppSelector(
    (state) => state.project.present.settings.startSceneId,
  );
  const startDirection = useAppSelector(
    (state) => state.project.present.settings.startDirection,
  );
  const runSceneSelectionOnly = useAppSelector(
    (state) => state.project.present.settings.runSceneSelectionOnly,
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

  const gbcEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono",
  );
  const previewAsMono = useAppSelector(
    (state) =>
      state.project.present.settings.colorMode === "mono" ||
      (state.project.present.settings.colorMode === "mixed" &&
        state.project.present.settings.previewAsMono),
  );
  const defaultMonoBGP = useAppSelector(
    (state) => state.project.present.settings.defaultMonoBGP,
  );
  const monoBGP = scene?.monoBGP || defaultMonoBGP;

  const defaultMonoOBP0 = useAppSelector(
    (state) => state.project.present.settings.defaultMonoOBP0,
  );
  const defaultMonoOBP1 = useAppSelector(
    (state) => state.project.present.settings.defaultMonoOBP1,
  );
  const monoOBJPalettes = useMemo(() => {
    return [
      scene?.monoOBP0 || defaultMonoOBP0,
      scene?.monoOBP1 || defaultMonoOBP1,
    ] as [MonoOBJPalette, MonoOBJPalette];
  }, [scene?.monoOBP0, defaultMonoOBP0, scene?.monoOBP1, defaultMonoOBP1]);

  const tool = useAppSelector((state) => state.editor.tool);
  const selectedBrush = useAppSelector((state) => state.editor.selectedBrush);

  const showLayers = useAppSelector((state) => state.editor.showLayers);

  const scenePaintSelection = useAppSelector((state) => {
    const selection = state.editor.scenePaintSelection;
    return selection?.sceneId === id ? selection : undefined;
  });

  const scenePaintSelectionMode =
    tool === TOOL_COLLISIONS
      ? "collisions"
      : tool === TOOL_COLORS
        ? "colors"
        : undefined;

  const activeScenePaintSelection =
    scenePaintSelection?.mode === scenePaintSelectionMode
      ? scenePaintSelection
      : undefined;

  const selectionOffsetActive =
    !!activeScenePaintSelection &&
    (activeScenePaintSelection.offset.x !== 0 ||
      activeScenePaintSelection.offset.y !== 0);

  const tileColors = useMemo(
    () => background?.tileColors ?? [],
    [background?.tileColors],
  );

  const collisionSelectionPreview = useMemo(() => {
    if (
      !scene ||
      !activeScenePaintSelection ||
      activeScenePaintSelection.mode !== "collisions" ||
      !selectionOffsetActive
    ) {
      return undefined;
    }

    return moveGridSelection(
      scene.collisions,
      scene.width,
      scene.height,
      activeScenePaintSelection.selection,
      activeScenePaintSelection.offset,
      0,
    );
  }, [scene, activeScenePaintSelection, selectionOffsetActive]);

  const colorSelectionPreview = useMemo(() => {
    if (
      !scene ||
      !activeScenePaintSelection ||
      activeScenePaintSelection.mode !== "colors" ||
      !selectionOffsetActive
    ) {
      return undefined;
    }

    return moveGridSelection(
      tileColors,
      scene.width,
      scene.height,
      activeScenePaintSelection.selection,
      activeScenePaintSelection.offset,
      0,
    );
  }, [scene, activeScenePaintSelection, selectionOffsetActive, tileColors]);

  const displayCollisions =
    collisionSelectionPreview ?? scene?.collisions ?? [];
  const displayTileColors = colorSelectionPreview ?? tileColors;

  const showEntities =
    (tool !== TOOL_COLORS &&
      tool !== TOOL_COLLISIONS &&
      tool !== TOOL_ERASER) ||
    showLayers;
  const showCollisions = useAppSelector(
    (state) =>
      (tool !== TOOL_COLORS || showLayers) &&
      (state.project.present.settings.showCollisions ||
        tool === TOOL_COLLISIONS),
  );
  const showPriorityMap = useAppSelector(
    (state) =>
      tool === TOOL_COLORS &&
      state.editor.selectedPalette === TILE_COLOR_PROP_PRIORITY,
  );
  const showSceneScreenGrid = useAppSelector(
    (state) => state.project.present.settings.showSceneScreenGrid,
  );
  const zoom = useAppSelector((state) => state.editor.zoom);
  const zoomRatio = zoom / 100;

  const visible = useAppSelector((state) => {
    const worldScrollX = state.editor.worldScrollX;
    const worldScrollY = state.editor.worldScrollY;
    const worldViewWidth = state.editor.worldViewWidth;
    const worldViewHeight = state.editor.worldViewHeight;
    const sidebarWidth = state.editor.worldSidebarWidth;
    const navigatorWidth = state.project.present.settings.showNavigator
      ? state.editor.navigatorSidebarWidth
      : 0;

    const viewMargin = 400;

    const viewBoundsX = (worldScrollX - viewMargin) / zoomRatio;
    const viewBoundsY = (worldScrollY - viewMargin) / zoomRatio;

    const viewBoundsWidth =
      (worldViewWidth - sidebarWidth - navigatorWidth + viewMargin * 2) /
      zoomRatio;
    const viewBoundsHeight = (worldViewHeight + viewMargin * 2) / zoomRatio;

    return scene
      ? scene.x + scene.width * 8 > viewBoundsX &&
          scene.x < viewBoundsX + viewBoundsWidth &&
          scene.y + scene.height * 8 + 50 > viewBoundsY &&
          scene.y < viewBoundsY + viewBoundsHeight
      : false;
  });

  const palettesLookup = useAppSelector((state) =>
    paletteSelectors.selectEntities(state),
  );
  const defaultBackgroundPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds ?? [],
  );

  const getPalette = useCallback(
    (paletteIndex: number) => {
      const sceneBackgroundPaletteIds = scene?.paletteIds ?? [];
      if (sceneBackgroundPaletteIds[paletteIndex] === "dmg") {
        return DMG_PALETTE;
      }
      return (
        palettesLookup[sceneBackgroundPaletteIds[paletteIndex]] ||
        palettesLookup[defaultBackgroundPaletteIds[paletteIndex]] ||
        DMG_PALETTE
      );
    },
    [defaultBackgroundPaletteIds, palettesLookup, scene?.paletteIds],
  );

  const palettes = useMemo(
    () =>
      gbcEnabled
        ? [
            getPalette(0),
            getPalette(1),
            getPalette(2),
            getPalette(3),
            getPalette(4),
            getPalette(5),
            getPalette(6),
            getPalette(7),
          ]
        : dmgPalettes,
    [gbcEnabled, getPalette],
  );

  const defaultSpritePaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultSpritePaletteIds ?? [],
  );

  const getSpritePalette = useCallback(
    (paletteIndex: number) => {
      const sceneSpritePaletteIds = scene?.spritePaletteIds ?? [];
      if (sceneSpritePaletteIds[paletteIndex] === "dmg") {
        return DMG_PALETTE;
      }
      return (
        palettesLookup[sceneSpritePaletteIds[paletteIndex]] ||
        palettesLookup[defaultSpritePaletteIds[paletteIndex]] ||
        DMG_PALETTE
      );
    },
    [defaultSpritePaletteIds, palettesLookup, scene?.spritePaletteIds],
  );

  const spritePalettes = useMemo(
    () =>
      gbcEnabled
        ? [
            getSpritePalette(0),
            getSpritePalette(1),
            getSpritePalette(2),
            getSpritePalette(3),
            getSpritePalette(4),
            getSpritePalette(5),
            getSpritePalette(6),
            getSpritePalette(7),
          ]
        : undefined,
    [gbcEnabled, getSpritePalette],
  );

  const slopePreview = useAppSelector((state) => state.editor.slopePreview);

  const hovered = useAppSelector((state) => state.editor.hover.sceneId === id);

  const dragState = useRef({
    lastTX: -1,
    lastTY: -1,
    lastPageX: -1,
    lastPageY: -1,
    sceneX: 0,
    sceneY: 0,
    zoomRatio: 0,
  });

  // Store selection as ref to prevent onMoveDrag from being recreated
  // every time multi selection changes (causes first drag to fail)
  const currentSceneSelectionIds = useRef<string[]>([]);
  useEffect(() => {
    currentSceneSelectionIds.current = sceneSelectionIds;
  }, [sceneSelectionIds]);

  const onMoveDrag = useCallback(
    (e: MouseEvent) => {
      const dragDeltaX =
        (e.pageX - dragState.current.lastPageX) / dragState.current.zoomRatio;
      const dragDeltaY =
        (e.pageY - dragState.current.lastPageY) / dragState.current.zoomRatio;

      dragState.current.lastPageX = e.pageX;
      dragState.current.lastPageY = e.pageY;
      dragState.current.sceneX += dragDeltaX;
      dragState.current.sceneY += dragDeltaY;

      dispatch(
        entitiesActions.moveWorldEntities({
          entityId: id,
          x: Math.round(dragState.current.sceneX / TILE_SIZE) * TILE_SIZE,
          y: Math.round(dragState.current.sceneY / TILE_SIZE) * TILE_SIZE,
          additionalEntityIds: currentSceneSelectionIds.current,
        }),
      );
    },
    [dispatch, id],
  );

  const onEndDrag = useCallback(() => {
    window.removeEventListener("mousemove", onMoveDrag);
    window.removeEventListener("mouseup", onEndDrag);
  }, [onMoveDrag]);

  const onStartDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!scene) {
        return;
      }

      if (!editable || e.nativeEvent.which === MIDDLE_MOUSE) {
        return;
      }

      dragState.current.lastPageX = e.pageX;
      dragState.current.lastPageY = e.pageY;
      dragState.current.sceneX = scene.x;
      dragState.current.sceneY = scene.y;
      dragState.current.zoomRatio = zoomRatio;

      dispatch(editorActions.selectScene({ sceneId: id }));

      window.addEventListener("mousemove", onMoveDrag);
      window.addEventListener("mouseup", onEndDrag);
    },
    [dispatch, editable, id, onEndDrag, onMoveDrag, scene, zoomRatio],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMoveDrag);
      window.removeEventListener("mouseup", onEndDrag);
    };
  }, [onEndDrag, onMoveDrag]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!scene) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.pageX - rect.left;
      const y = e.pageY - rect.top;
      const pX = Math.floor(x / zoomRatio);
      const pY = Math.floor(y / zoomRatio);
      const tX = Math.floor(pX / TILE_SIZE);
      const tY = Math.floor(pY / TILE_SIZE);

      if (
        pX !== dragState.current.lastTX ||
        pY !== dragState.current.lastTY ||
        !hovered
      ) {
        if (tX >= 0 && tY >= 0 && tX < scene.width && tY < scene.height) {
          dispatch(editorActions.sceneHover({ sceneId: id, x: tX, y: tY }));
          dispatch(
            entitiesActions.moveSelectedEntityToPx({
              sceneId: id,
              x: pX,
              y: pY,
            }),
          );
        }
        dragState.current.lastTX = pX;
        dragState.current.lastTY = pY;
      }
    },
    [dispatch, hovered, id, scene, zoomRatio],
  );

  const onMouseLeave = useCallback(() => {
    dispatch(
      editorActions.sceneHover({
        sceneId: "",
        x: dragState.current.lastTX,
        y: dragState.current.lastTY,
      }),
    );
  }, [dispatch]);

  //#region Context Menu

  const getContextMenu = useCallback(
    ({ closeMenu: onClose }: { closeMenu: () => void }) => {
      const state = store.getState();
      const { x: hoverX, y: hoverY } = state.editor.hover;
      return renderSceneContextMenu({
        dispatch,
        sceneId: id,
        additionalSceneIds: sceneSelectionIds,
        startSceneId,
        startDirection,
        hoverX,
        hoverY,
        colorsEnabled: gbcEnabled,
        colorModeOverride: scene.colorModeOverride,
        runSceneSelectionOnly,
        onClose,
      });
    },
    [
      dispatch,
      store,
      id,
      sceneSelectionIds,
      startDirection,
      startSceneId,
      runSceneSelectionOnly,
      gbcEnabled,
      scene.colorModeOverride,
    ],
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
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          width: scene.width * TILE_SIZE,
          height: scene.height * TILE_SIZE,
        }}
      >
        {background && (
          <>
            {gbcEnabled && background.autoColor ? (
              <AutoColorizedImage
                width={scene.width * TILE_SIZE}
                height={scene.height * TILE_SIZE}
                src={assetURL("backgrounds", background)}
                tilesSrc={
                  tilesOverride
                    ? assetURL("backgrounds", tilesOverride)
                    : undefined
                }
                uiPalette={
                  scene?.paletteIds?.[7] === "auto" ? undefined : palettes[7]
                }
                previewAsMono={previewAsMono}
                monoBGP={monoBGP}
              />
            ) : (
              <ColorizedImage
                width={scene.width * TILE_SIZE}
                height={scene.height * TILE_SIZE}
                src={
                  tilesOverride
                    ? assetURL("backgrounds", tilesOverride)
                    : assetURL("backgrounds", background)
                }
                tiles={displayTileColors}
                palettes={palettes}
                previewAsMono={previewAsMono}
                monoBGP={monoBGP}
              />
            )}
          </>
        )}
        {showCollisions && (
          <SceneOverlay>
            <SceneCollisions
              width={scene.width}
              height={scene.height}
              collisions={displayCollisions}
              sceneTypeKey={scene.type}
            />
            {selected && slopePreview && (
              <SceneSlopePreview
                width={scene.width}
                height={scene.height}
                slopePreview={slopePreview}
              />
            )}
          </SceneOverlay>
        )}

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

        {background && showPriorityMap && (
          <SceneOverlay>
            <ScenePriorityMap
              width={scene.width}
              height={scene.height}
              tileColors={displayTileColors}
            />
          </SceneOverlay>
        )}

        {selected && <SceneParallaxOverlay sceneId={id} />}

        {!sceneTypeEnabled && (
          <SceneErrorOverlay>
            <WarningIcon />
          </SceneErrorOverlay>
        )}

        {selectedBrush === BRUSH_SELECTION && activeScenePaintSelection && (
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
        )}

        {editable && (hovered || selected) && (
          <SceneCursor
            sceneId={id}
            enabled={hovered}
            sceneFiltered={sceneFiltered}
          />
        )}
        {showEntities &&
          scene.triggers.map((triggerId) => (
            <TriggerView
              key={triggerId}
              id={triggerId}
              sceneId={id}
              editable={editable}
            />
          ))}
        <SceneContext.Provider
          value={{ spriteMode: scene.spriteMode ?? defaultSpriteMode }}
        >
          {showEntities &&
            scene.actors.map((actorId) => (
              <WorldActor
                key={actorId}
                id={actorId}
                sceneId={id}
                palettes={spritePalettes}
                monoPalettes={monoOBJPalettes}
                editable={editable}
              />
            ))}
        </SceneContext.Provider>
        {selected && (
          <SceneOverlay $noPointerEvents>
            <SceneEventHelper scene={scene} />
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
