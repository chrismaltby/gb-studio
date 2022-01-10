import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import getCoords from "lib/helpers/getCoords";
import Actor from "./Actor";
import Trigger from "./Trigger";
import SceneCollisions from "./SceneCollisions";
import { normalizedFindSceneEvent } from "lib/helpers/eventSystem";
import EventHelper from "./EventHelper";
import {
  SceneShape,
  EventShape,
  BackgroundShape,
  PaletteShape,
} from "store/stateShape";
import { assetFilename } from "lib/helpers/gbstudio";
import SceneCursor from "./SceneCursor";
import ColorizedImage from "./ColorizedImage";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  DMG_PALETTE,
  MIDDLE_MOUSE,
} from "../../consts";
import { getCachedObject } from "lib/helpers/cache";
import SceneInfo from "./SceneInfo";
import {
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  backgroundSelectors,
  paletteSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";

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

class Scene extends Component {
  constructor() {
    super();
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("mousemove", this.onMoveDrag);
    window.addEventListener("mouseup", this.onEndDrag);
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.onMoveDrag);
    window.removeEventListener("mouseup", this.onEndDrag);
  }

  onMouseMove = (e) => {
    const {
      id,
      zoomRatio,
      width,
      height,
      moveSelectedEntity,
      sceneHover,
      hovered,
    } = this.props;
    const pos = getCoords(e.currentTarget);
    const x = e.pageX - pos.left;
    const y = e.pageY - pos.top;
    const tX = Math.floor(x / (8 * zoomRatio));
    const tY = Math.floor(y / (8 * zoomRatio));

    if (tX !== this.lastTX || tY !== this.lastTY || !hovered) {
      if (tX >= 0 && tY >= 0 && tX < width && tY < height) {
        sceneHover({ sceneId: id, x: tX, y: tY });
        moveSelectedEntity({ sceneId: id, x: tX, y: tY });
      }
      this.lastTX = tX;
      this.lastTY = tY;
    }
  };

  onMouseLeave = (_e) => {
    const { sceneHover } = this.props;
    sceneHover({ sceneId: "", x: this.lastTX, y: this.lastTY });
  };

  onStartDrag = (e) => {
    const { id, selectScene, editable } = this.props;

    if (!editable || e.nativeEvent.which === MIDDLE_MOUSE) {
      return;
    }

    this.lastPageX = e.pageX;
    this.lastPageY = e.pageY;

    selectScene({ sceneId: id });

    this.dragging = true;
  };

  onMoveDrag = (e) => {
    const { zoomRatio, moveScene, id, scene } = this.props;
    const { x, y } = scene;
    if (this.dragging) {
      const dragDeltaX = (e.pageX - this.lastPageX) / zoomRatio;
      const dragDeltaY = (e.pageY - this.lastPageY) / zoomRatio;

      this.lastPageX = e.pageX;
      this.lastPageY = e.pageY;

      moveScene({ sceneId: id, x: x + dragDeltaX, y: y + dragDeltaY });
    }
  };

  onEndDrag = (_e) => {
    this.dragging = false;
  };

  render() {
    const {
      id,
      scene,
      visible,
      sceneName,
      image,
      event,
      width,
      height,
      projectRoot,
      selected,
      hovered,
      palettes,
      spritePalettes,
      sceneFiltered,
      showEntities,
      showCollisions,
      labelOffsetLeft,
      labelOffsetRight,
      parallaxHoverLayer,
      editable,
    } = this.props;

    const {
      x,
      y,
      triggers = [],
      collisions = [],
      actors = [],
      labelColor,
    } = scene;

    /**
     * Image may potentially be `undefined` if a user has selected an image,
     * then deleted it.
     */
    const { tileColors } = image || {};

    if (!visible) {
      return null;
    }

    return (
      <div
        ref={this.containerRef}
        className={cx("Scene", {
          "Scene--Selected": selected,
          "Scene--Filtered": sceneFiltered,
        })}
        style={{
          top: y,
          left: x,
        }}
      >
        <div
          className="Scene__Name"
          onMouseDown={this.onStartDrag}
          style={{
            paddingLeft: labelOffsetLeft,
            paddingRight: labelOffsetRight,
          }}
        >
          <div
            className={cx("Scene__Label", {
              "Scene__Label--Red": labelColor === "red",
              "Scene__Label--Orange": labelColor === "orange",
              "Scene__Label--Yellow": labelColor === "yellow",
              "Scene__Label--Green": labelColor === "green",
              "Scene__Label--Blue": labelColor === "blue",
              "Scene__Label--Purple": labelColor === "purple",
              "Scene__Label--Gray": labelColor === "gray",
            })}
          >
            {sceneName}
          </div>
        </div>
        <div
          className="Scene__Image"
          onMouseMove={this.onMouseMove}
          onMouseLeave={this.onMouseLeave}
          style={{
            width: width * TILE_SIZE,
            height: height * TILE_SIZE,
          }}
        >
          {image && (
            <ColorizedImage
              className="Scene__Background"
              alt=""
              width={width * TILE_SIZE}
              height={height * TILE_SIZE}
              src={`file://${assetFilename(
                projectRoot,
                "backgrounds",
                image
              )}?_v=${image._v}`}
              tiles={tileColors}
              palettes={palettes}
            />
          )}

          {showCollisions && (
            <div className="Scene__Collisions">
              <SceneCollisions
                width={width}
                height={height}
                collisions={collisions}
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
                (layer, layerIndex) =>
                  layerIndex !== scene.parallax.length - 1 && (
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
                        (memo, layer, layerIndex) =>
                          memo + layerIndex < scene.parallax.length - 1
                            ? layer.height || 1
                            : 0,
                        0
                      )),
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
          {editable && (
            <SceneCursor
              sceneId={id}
              enabled={hovered}
              sceneFiltered={sceneFiltered}
            />
          )}
          {showEntities &&
            triggers.map((triggerId) => (
              <Trigger
                key={triggerId}
                id={triggerId}
                sceneId={id}
                editable={editable}
              />
            ))}
          {showEntities &&
            actors.map((actorId) => (
              <Actor
                key={actorId}
                id={actorId}
                sceneId={id}
                palettes={spritePalettes}
                editable={editable}
              />
            ))}
          {event && (
            <div className="Scene__EventHelper">
              <EventHelper event={event} scene={scene} />
            </div>
          )}
        </div>
        {selected && (
          <div
            className="Scene__Info"
            onMouseDown={this.onStartDrag}
            style={{
              paddingLeft: labelOffsetLeft,
              paddingRight: labelOffsetRight,
            }}
          >
            <SceneInfo id={id} />
          </div>
        )}
      </div>
    );
  }
}

Scene.propTypes = {
  projectRoot: PropTypes.string.isRequired,
  scene: SceneShape.isRequired,
  event: EventShape,
  id: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  image: BackgroundShape,
  prefab: PropTypes.shape({}),
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  selected: PropTypes.bool.isRequired,
  hovered: PropTypes.bool.isRequired,
  palettes: PropTypes.arrayOf(PaletteShape).isRequired,
  showEntities: PropTypes.bool.isRequired,
  showCollisions: PropTypes.bool.isRequired,
  zoomRatio: PropTypes.number.isRequired,
  moveScene: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  moveSelectedEntity: PropTypes.func.isRequired,
  sceneHover: PropTypes.func.isRequired,
  sceneName: PropTypes.string.isRequired,
  sceneFiltered: PropTypes.bool.isRequired,
  labelOffsetLeft: PropTypes.number.isRequired,
  labelOffsetRight: PropTypes.number.isRequired,
  editable: PropTypes.bool.isRequired,
};

Scene.defaultProps = {
  image: null,
  event: null,
  prefab: null,
};

function mapStateToProps(state, props) {
  const {
    scene: sceneId,
    dragging: editorDragging,
    showLayers,
    parallaxHoverLayer,
  } = state.editor;

  const actorsLookup = actorSelectors.selectEntities(state);
  const triggersLookup = triggerSelectors.selectEntities(state);
  const backgroundsLookup = backgroundSelectors.selectEntities(state);
  const scriptEventsLookup = scriptEventSelectors.selectEntities(state);

  const settings = state.project.present.settings;

  const scene = sceneSelectors.selectById(state, props.id);

  const image = backgroundsLookup[scene.backgroundId];

  const sceneEventVisible =
    state.editor.eventId && state.editor.scene === props.id;
  const event = sceneEventVisible && scriptEventsLookup[state.editor.eventId];

  const selected = sceneId === props.id;
  const dragging = selected && editorDragging;
  const hovered = state.editor.hover.sceneId === props.id;
  const tool = state.editor.tool;

  const { worldSidebarWidth: sidebarWidth } = state.editor;

  const { worldScrollX, worldScrollY, worldViewWidth, worldViewHeight, zoom } =
    state.editor;
  const zoomRatio = zoom / 100;

  const viewBoundsX = worldScrollX / zoomRatio;
  const viewBoundsY = worldScrollY / zoomRatio;
  const viewBoundsWidth = (worldViewWidth - sidebarWidth) / zoomRatio;
  const viewBoundsHeight = worldViewHeight / zoomRatio;

  const visible =
    scene.x + scene.width * 8 > viewBoundsX &&
    scene.x < viewBoundsX + viewBoundsWidth &&
    scene.y + scene.height * 8 + 50 > viewBoundsY &&
    scene.y < viewBoundsY + viewBoundsHeight;

  const offsetLabels = scene.width * 8 > viewBoundsWidth / 2;
  const labelOffsetLeft = offsetLabels
    ? Math.min(Math.max(0, viewBoundsX - scene.x + 10), scene.width * 8 - 100)
    : 0;
  const labelOffsetRight = offsetLabels
    ? Math.min(
        Math.max(
          0,
          scene.x + scene.width * 8 - 10 - (viewBoundsX + viewBoundsWidth)
        ),
        scene.width * 8 - 100
      )
    : 0;

  const searchTerm = state.editor.searchTerm;
  const sceneName = scene.name || `Scene ${props.index + 1}`;
  const sceneFiltered =
    (searchTerm &&
      sceneName.toUpperCase().indexOf(searchTerm.toUpperCase()) === -1 &&
      scene.id !== searchTerm) ||
    false;

  const gbcEnabled = settings.customColorsEnabled;

  const showEntities =
    (tool !== TOOL_COLORS &&
      tool !== TOOL_COLLISIONS &&
      tool !== TOOL_ERASER) ||
    showLayers;
  const showCollisions =
    (tool !== TOOL_COLORS || showLayers) &&
    (settings.showCollisions || tool === TOOL_COLLISIONS);

  const palettesLookup = paletteSelectors.selectEntities(state);
  const defaultBackgroundPaletteIds =
    settings.defaultBackgroundPaletteIds || [];
  const sceneBackgroundPaletteIds = scene.paletteIds || [];

  const getPalette = (paletteIndex) => {
    if (sceneBackgroundPaletteIds[paletteIndex] === "dmg") {
      return DMG_PALETTE;
    }
    return (
      palettesLookup[sceneBackgroundPaletteIds[paletteIndex]] ||
      palettesLookup[defaultBackgroundPaletteIds[paletteIndex]] ||
      DMG_PALETTE
    );
  };

  const palettes = gbcEnabled
    ? getCachedObject([
        getPalette(0),
        getPalette(1),
        getPalette(2),
        getPalette(3),
        getPalette(4),
        getPalette(5),
        getPalette(6),
        getPalette(7),
      ])
    : dmgPalettes;

  const defaultSpritePaletteIds = settings.defaultSpritePaletteIds || [];
  const sceneSpritePaletteIds = scene.spritePaletteIds || [];

  const getSpritePalette = (paletteIndex) => {
    if (sceneSpritePaletteIds[paletteIndex] === "dmg") {
      return DMG_PALETTE;
    }
    return (
      palettesLookup[sceneSpritePaletteIds[paletteIndex]] ||
      palettesLookup[defaultSpritePaletteIds[paletteIndex]] ||
      DMG_PALETTE
    );
  };

  const spritePalettes = gbcEnabled
    ? getCachedObject([
        getSpritePalette(0),
        getSpritePalette(1),
        getSpritePalette(2),
        getSpritePalette(3),
        getSpritePalette(4),
        getSpritePalette(5),
        getSpritePalette(6),
        getSpritePalette(7),
      ])
    : null;

  return {
    scene,
    visible,
    projectRoot: state.document && state.document.root,
    prefab: undefined,
    event,
    image,
    width: image ? image.width : 32,
    height: image ? image.height : 32,
    zoomRatio: (state.editor.zoom || 100) / 100,
    selected,
    dragging,
    hovered,
    sceneName,
    sceneFiltered,
    palettes,
    spritePalettes,
    showEntities,
    showCollisions,
    labelOffsetLeft,
    labelOffsetRight,
    parallaxHoverLayer,
  };
}

const mapDispatchToProps = {
  moveScene: entitiesActions.moveScene,
  selectScene: editorActions.selectScene,
  moveSelectedEntity: entitiesActions.moveSelectedEntity,
  sceneHover: editorActions.sceneHover,
};

export default connect(mapStateToProps, mapDispatchToProps)(Scene);
