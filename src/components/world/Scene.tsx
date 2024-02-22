import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import cx from "classnames";
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
import { sceneName } from "store/features/entities/entitiesHelpers";
import { assetFilename } from "shared/lib/helpers/assets";
import { getDOMElementCoords } from "renderer/lib/helpers/dom";
import { RootState } from "store/configureStore";

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

const SceneView = ({ id, index, editable }: SceneViewProps) => {
  const dispatch = useDispatch();
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, id)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);

  const background = useSelector((state: RootState) =>
    backgroundSelectors.selectById(state, scene?.backgroundId ?? "")
  );

  const selected = useSelector((state: RootState) => state.editor.scene === id);

  const searchTerm = useSelector((state: RootState) => state.editor.searchTerm);
  const name = useMemo(
    () => (scene ? sceneName(scene, index) : ""),
    [index, scene]
  );

  const sceneFiltered =
    (searchTerm &&
      name.toUpperCase().indexOf(searchTerm.toUpperCase()) === -1 &&
      id !== searchTerm) ||
    false;

  const gbcEnabled = useSelector(
    (state: RootState) => state.project.present.settings.customColorsEnabled
  );

  const tool = useSelector((state: RootState) => state.editor.tool);
  const showLayers = useSelector((state: RootState) => state.editor.showLayers);

  const showEntities =
    (tool !== TOOL_COLORS &&
      tool !== TOOL_COLLISIONS &&
      tool !== TOOL_ERASER) ||
    showLayers;
  const showCollisions = useSelector(
    (state: RootState) =>
      (tool !== TOOL_COLORS || showLayers) &&
      (state.project.present.settings.showCollisions ||
        tool === TOOL_COLLISIONS)
  );
  const showPriorityMap = useSelector(
    (state: RootState) =>
      tool === TOOL_COLORS &&
      state.editor.selectedPalette === TILE_COLOR_PROP_PRIORITY
  );

  const zoom = useSelector((state: RootState) => state.editor.zoom);
  const zoomRatio = zoom / 100;

  const visible = useSelector((state: RootState) => {
    const worldScrollX = state.editor.worldScrollX;
    const worldScrollY = state.editor.worldScrollY;
    const worldViewWidth = state.editor.worldViewWidth;
    const worldViewHeight = state.editor.worldViewHeight;
    const sidebarWidth = state.editor.worldSidebarWidth;
    const viewBoundsX = worldScrollX / zoomRatio;
    const viewBoundsY = worldScrollY / zoomRatio;
    const viewBoundsWidth = (worldViewWidth - sidebarWidth) / zoomRatio;
    const viewBoundsHeight = worldViewHeight / zoomRatio;
    return scene
      ? scene.x + scene.width * 8 > viewBoundsX &&
          scene.x < viewBoundsX + viewBoundsWidth &&
          scene.y + scene.height * 8 + 50 > viewBoundsY &&
          scene.y < viewBoundsY + viewBoundsHeight
      : false;
  });

  const labelOffsetLeft = useSelector((state: RootState) => {
    const worldScrollX = state.editor.worldScrollX;
    const worldViewWidth = state.editor.worldViewWidth;
    const sidebarWidth = state.editor.worldSidebarWidth;
    const viewBoundsX = worldScrollX / zoomRatio;
    const viewBoundsWidth = (worldViewWidth - sidebarWidth) / zoomRatio;
    const offsetLabels = scene ? scene.width * 8 > viewBoundsWidth / 2 : 0;
    return offsetLabels && scene
      ? Math.min(Math.max(0, viewBoundsX - scene.x + 10), scene.width * 8 - 100)
      : 0;
  });

  const labelOffsetRight = useSelector((state: RootState) => {
    const worldScrollX = state.editor.worldScrollX;
    const worldViewWidth = state.editor.worldViewWidth;
    const sidebarWidth = state.editor.worldSidebarWidth;
    const viewBoundsX = worldScrollX / zoomRatio;
    const viewBoundsWidth = (worldViewWidth - sidebarWidth) / zoomRatio;
    const offsetLabels = scene ? scene.width * 8 > viewBoundsWidth / 2 : 0;
    return offsetLabels && scene
      ? Math.min(
          Math.max(
            0,
            scene.x + scene.width * 8 - 10 - (viewBoundsX + viewBoundsWidth)
          ),
          scene.width * 8 - 100
        )
      : 0;
  });

  const tileColors = useMemo(
    () => background?.tileColors ?? [],
    [background?.tileColors]
  );

  const palettesLookup = useSelector((state: RootState) =>
    paletteSelectors.selectEntities(state)
  );
  const defaultBackgroundPaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultBackgroundPaletteIds ?? []
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
    [defaultBackgroundPaletteIds, palettesLookup, scene?.paletteIds]
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
    [gbcEnabled, getPalette]
  );

  const defaultSpritePaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultSpritePaletteIds ?? []
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
    [defaultSpritePaletteIds, palettesLookup, scene?.spritePaletteIds]
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
    [gbcEnabled, getSpritePalette]
  );

  const slopePreview = useSelector(
    (state: RootState) => state.editor.slopePreview
  );

  const parallaxHoverLayer = useSelector(
    (state: RootState) => state.editor.parallaxHoverLayer
  );

  const hovered = useSelector(
    (state: RootState) => state.editor.hover.sceneId === id
  );

  const dragState = useRef({
    lastTX: -1,
    lastTY: -1,
    lastPageX: -1,
    lastPageY: -1,
    sceneX: 0,
    sceneY: 0,
    zoomRatio: 0,
  });

  const onMoveDrag = useCallback(
    (e) => {
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
          x: dragState.current.sceneX,
          y: dragState.current.sceneY,
        })
      );
    },
    [dispatch, id]
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
    [dispatch, editable, id, onEndDrag, onMoveDrag, scene, zoomRatio]
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
            entitiesActions.moveSelectedEntity({ sceneId: id, x: tX, y: tY })
          );
        }
        dragState.current.lastTX = tX;
        dragState.current.lastTY = tY;
      }
    },
    [dispatch, hovered, id, scene, zoomRatio]
  );

  const onMouseLeave = useCallback(() => {
    dispatch(
      editorActions.sceneHover({
        sceneId: "",
        x: dragState.current.lastTX,
        y: dragState.current.lastTY,
      })
    );
  }, [dispatch]);

  if (!scene || !visible) {
    return <></>;
  }

  return (
    <div
      className={cx("Scene", {
        "Scene--Selected": selected,
        "Scene--Filtered": sceneFiltered,
      })}
      style={{
        top: scene.y,
        left: scene.x,
      }}
    >
      <div
        className="Scene__Name"
        onMouseDown={onStartDrag}
        style={{
          paddingLeft: labelOffsetLeft,
          paddingRight: labelOffsetRight,
        }}
      >
        <div
          className={cx("Scene__Label", {
            "Scene__Label--Red": scene.labelColor === "red",
            "Scene__Label--Orange": scene.labelColor === "orange",
            "Scene__Label--Yellow": scene.labelColor === "yellow",
            "Scene__Label--Green": scene.labelColor === "green",
            "Scene__Label--Blue": scene.labelColor === "blue",
            "Scene__Label--Purple": scene.labelColor === "purple",
            "Scene__Label--Gray": scene.labelColor === "gray",
          })}
        >
          {name}
        </div>
      </div>
      <div
        className="Scene__Image"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          width: scene.width * TILE_SIZE,
          height: scene.height * TILE_SIZE,
        }}
      >
        {background && (
          <ColorizedImage
            className="Scene__Background"
            alt=""
            width={scene.width * TILE_SIZE}
            height={scene.height * TILE_SIZE}
            src={`file://${assetFilename(
              projectRoot,
              "backgrounds",
              background
            )}?_v=${background._v}`}
            tiles={tileColors}
            palettes={palettes}
          />
        )}

        {showCollisions && (
          <div className="Scene__Collisions">
            <SceneCollisions
              width={scene.width}
              height={scene.height}
              collisions={scene.collisions}
            />
            {selected && slopePreview && (
              <SceneSlopePreview
                width={scene.width}
                height={scene.height}
                slopePreview={slopePreview}
              />
            )}
          </div>
        )}

        {background && showPriorityMap && (
          <div className="Scene__Collisions">
            <ScenePriorityMap
              width={scene.width}
              height={scene.height}
              tileColors={tileColors}
            />
          </div>
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
                )
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
                      0
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
        {selected && (
          <div className="Scene__EventHelper">
            <SceneEventHelper scene={scene} />
          </div>
        )}
      </div>
      {selected && (
        <div
          className="Scene__Info"
          onMouseDown={onStartDrag}
          style={{
            paddingLeft: labelOffsetLeft,
            paddingRight: labelOffsetRight,
          }}
        >
          <SceneInfo />
        </div>
      )}
    </div>
  );
};

export default SceneView;
