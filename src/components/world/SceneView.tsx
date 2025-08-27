import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import WorldActor from "./ActorView";
import TriggerView from "./TriggerView";
import SceneCollisions from "./SceneCollisions";
import SceneCursor from "./SceneCursor";
import ColorizedImage from "./ColorizedImage";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  DMG_PALETTE,
  MIDDLE_MOUSE,
  TILE_COLOR_PROP_PRIORITY,
  TOOL_SELECT,
} from "consts";
import SceneInfo from "./SceneInfo";
import {
  sceneSelectors,
  backgroundSelectors,
  paletteSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import ScenePriorityMap from "./ScenePriorityMap";
import SceneSlopePreview from "./SceneSlopePreview";
import { SceneEventHelper } from "./SceneEventHelper";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import { getDOMElementCoords } from "renderer/lib/helpers/dom";
import styled, { css } from "styled-components";
import { LabelSpan } from "ui/buttons/LabelButton";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { assetURL } from "shared/lib/helpers/assets";
import AutoColorizedImage from "components/world/AutoColorizedImage";
import { ContextMenu } from "ui/menu/ContextMenu";
import renderSceneContextMenu from "./renderSceneContextMenu";
import SceneScrollBounds from "./SceneScrollBounds";
import { SceneContext } from "components/script/SceneContext";

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

const SceneMetadata = styled.div`
  white-space: nowrap;
  overflow: hidden;
  line-height: 20px;
  font-size: 11px;
  transition:
    padding-left 0.1s ease-in-out,
    padding-right 0.1s ease-in-out;
  transition-delay: 0.3s;
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

  const startSceneId = useAppSelector(
    (state) => state.project.present.settings.startSceneId,
  );
  const startDirection = useAppSelector(
    (state) => state.project.present.settings.startDirection,
  );
  const { x: hoverX, y: hoverY } = useAppSelector(
    (state) => state.editor.hover,
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
  const lastNamePart = useMemo(() => name.replace(/.*[/\\]/, ""), [name]);

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
      state.project.present.settings.colorMode === "mixed" &&
      state.project.present.settings.previewAsMono,
  );

  const tool = useAppSelector((state) => state.editor.tool);
  const showLayers = useAppSelector((state) => state.editor.showLayers);

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

  const labelOffsetLeft = useAppSelector((state) => {
    if (!visible) {
      return 0;
    }
    const worldScrollX = state.editor.worldScrollX;
    const worldViewWidth = state.editor.worldViewWidth;
    const sidebarWidth = state.editor.worldSidebarWidth;
    const navigatorWidth = state.project.present.settings.showNavigator
      ? state.editor.navigatorSidebarWidth
      : 0;
    const viewBoundsX = worldScrollX / zoomRatio;

    const viewBoundsWidth =
      (worldViewWidth - sidebarWidth - navigatorWidth) / zoomRatio;

    const offsetLabels = scene ? scene.width * 8 > viewBoundsWidth / 2 : 0;
    return offsetLabels && scene
      ? Math.min(Math.max(0, viewBoundsX - scene.x), scene.width * 8 - 160)
      : 0;
  });

  const labelOffsetRight = useAppSelector((state) => {
    if (!visible) {
      return 0;
    }
    const worldScrollX = state.editor.worldScrollX;
    const worldViewWidth = state.editor.worldViewWidth;
    const sidebarWidth = state.editor.worldSidebarWidth;
    const navigatorWidth = state.project.present.settings.showNavigator
      ? state.editor.navigatorSidebarWidth
      : 0;
    const viewBoundsX = worldScrollX / zoomRatio;
    const viewBoundsWidth =
      (worldViewWidth - sidebarWidth - navigatorWidth) / zoomRatio;
    const offsetLabels = scene ? scene.width * 8 > viewBoundsWidth / 2 : 0;
    return offsetLabels && scene
      ? Math.min(
          Math.max(
            0,
            scene.x + scene.width * 8 - (viewBoundsX + viewBoundsWidth),
          ),
          scene.width * 8 - 160,
        )
      : 0;
  });

  const tileColors = useMemo(
    () => background?.tileColors ?? [],
    [background?.tileColors],
  );

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

  const parallaxHoverLayer = useAppSelector(
    (state) => state.editor.parallaxHoverLayer,
  );

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
        entitiesActions.moveScene({
          sceneId: id,
          x: Math.round(dragState.current.sceneX / TILE_SIZE) * TILE_SIZE,
          y: Math.round(dragState.current.sceneY / TILE_SIZE) * TILE_SIZE,
          additionalSceneIds: currentSceneSelectionIds.current,
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
      const pos = getDOMElementCoords(e.currentTarget);
      const x = e.pageX - pos.left;
      const y = e.pageY - pos.top;
      const tX = Math.floor(x / (8 * zoomRatio));
      const tY = Math.floor(y / (8 * zoomRatio));

      if (
        tX !== dragState.current.lastTX ||
        tY !== dragState.current.lastTY ||
        !hovered
      ) {
        if (tX >= 0 && tY >= 0 && tX < scene.width && tY < scene.height) {
          dispatch(editorActions.sceneHover({ sceneId: id, x: tX, y: tY }));
          dispatch(
            entitiesActions.moveSelectedEntity({ sceneId: id, x: tX, y: tY }),
          );
        }
        dragState.current.lastTX = tX;
        dragState.current.lastTY = tY;
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

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    menu: JSX.Element[];
  }>();

  const onContextMenuClose = useCallback(() => {
    setContextMenu(undefined);
  }, []);

  const renderContextMenu = useCallback(() => {
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
      onClose: onContextMenuClose,
    });
  }, [
    dispatch,
    hoverX,
    hoverY,
    id,
    sceneSelectionIds,
    startDirection,
    startSceneId,
    runSceneSelectionOnly,
    gbcEnabled,
    scene.colorModeOverride,
    onContextMenuClose,
  ]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (tool !== TOOL_SELECT) {
        return;
      }
      if (!renderContextMenu) {
        return;
      }
      const menu = renderContextMenu();
      if (!menu) {
        return;
      }
      setContextMenu({ x: e.pageX, y: e.pageY, menu });
    },
    [renderContextMenu, tool],
  );

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
      <SceneMetadata
        onMouseDown={onStartDrag}
        style={{
          paddingLeft: labelOffsetLeft,
          paddingRight: labelOffsetRight,
        }}
      >
        <SceneName
          title={scene.notes}
          style={{
            maxWidth:
              scene.width * TILE_SIZE - (labelOffsetLeft + labelOffsetRight),
          }}
        >
          <LabelSpan color={scene.labelColor}>{lastNamePart}</LabelSpan>
        </SceneName>
      </SceneMetadata>
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
                previewAsMono={previewAsMono}
              />
            ) : (
              <ColorizedImage
                width={scene.width * TILE_SIZE}
                height={scene.height * TILE_SIZE}
                src={assetURL("backgrounds", background)}
                tiles={tileColors}
                palettes={palettes}
                previewAsMono={previewAsMono}
              />
            )}
          </>
        )}
        {showCollisions && (
          <SceneOverlay>
            <SceneCollisions
              width={scene.width}
              height={scene.height}
              collisions={scene.collisions}
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

        {background && showPriorityMap && (
          <SceneOverlay>
            <ScenePriorityMap
              width={scene.width}
              height={scene.height}
              tileColors={tileColors}
            />
          </SceneOverlay>
        )}

        {selected && parallaxHoverLayer !== undefined && scene.parallax && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
            }}
          >
            {scene.parallax.map(
              (layer, layerIndex, layers) =>
                layerIndex !== layers.length - 1 && (
                  <div
                    key={layerIndex}
                    style={{
                      background:
                        parallaxHoverLayer === layerIndex
                          ? `rgba(0,255,255,0.7)`
                          : `rgba(0,255,255,0.2)`,
                      height: (layer.height || 1) * 8,
                      borderBottom: "2px solid rgb(0,200,200)",
                      boxSizing: "border-box",
                    }}
                  />
                ),
            )}
            <div
              style={{
                background:
                  parallaxHoverLayer === scene.parallax.length - 1
                    ? `rgba(0,255,255,0.7)`
                    : `rgba(0,255,255,0.2)`,
                height:
                  8 *
                  (scene.height -
                    scene.parallax.reduce(
                      (memo, layer, layerIndex, layers) =>
                        memo + layerIndex < layers.length - 1
                          ? layer.height || 1
                          : 0,
                      0,
                    )),
                boxSizing: "border-box",
              }}
            />
          </div>
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
        <SceneMetadata
          onMouseDown={onStartDrag}
          style={{
            paddingLeft: labelOffsetLeft,
            paddingRight: labelOffsetRight,
          }}
        >
          <SceneInfo />
        </SceneMetadata>
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
  );
});

export default SceneView;
