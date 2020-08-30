import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import * as actions from "../../actions";
import getCoords from "../../lib/helpers/getCoords";
import Actor from "./Actor";
import Trigger from "./Trigger";
import SceneCollisions from "./SceneCollisions";
import { normalizedFindSceneEvent } from "../../lib/helpers/eventSystem";
import EventHelper from "./EventHelper";
import {
  SceneShape,
  EventShape,
  BackgroundShape,
  PaletteShape,
} from "../../reducers/stateShape";
import { assetFilename } from "../../lib/helpers/gbstudio";
import SceneCursor from "./SceneCursor";
import {
  getActorsLookup,
  getTriggersLookup,
  getScenesLookup,
  getBackgroundsLookup,
  getSettings,
  getPalettesLookup,
} from "../../reducers/entitiesReducer";
import ColorizedImage from "./ColorizedImage";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  DMG_PALETTE,
} from "../../consts";
import { getCachedObject } from "../../lib/helpers/cache";
import SceneInfo from "./SceneInfo";
import { sceneSelectors, actions as entityActions } from "../../store/features/entities/entitiesSlice";
import { actions as editorActions } from "../../store/features/editor/editorSlice";

const TILE_SIZE = 8;

const dmgPalettes = [
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
        sceneHover({sceneId: id, x: tX, y: tY});
        moveSelectedEntity(id, tX, tY);
      }
      this.lastTX = tX;
      this.lastTY = tY;
    }
  };

  onMouseLeave = (e) => {
    const { sceneHover } = this.props;
    sceneHover({sceneId: "", x: this.lastTX, y: this.lastTY});
  };

  onStartDrag = (e) => {
    const { id, selectScene } = this.props;
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

      moveScene({sceneId: id, x: x + dragDeltaX, y: y + dragDeltaY});
    }
  };

  onEndDrag = (e) => {
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
      sceneFiltered,
      simplifiedRender,
      showEntities,
      showCollisions,
      labelOffsetLeft,
      labelOffsetRight
    } = this.props;

    const {
      x,
      y,
      triggers = [],
      collisions = [],
      actors = [],
      tileColors,
      labelColor
    } = scene;

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
            paddingRight: labelOffsetRight
          }}
        >
          <div className={cx("Scene__Label", {
              "Scene__Label--Red": labelColor === "red",
              "Scene__Label--Orange": labelColor === "orange",
              "Scene__Label--Yellow": labelColor === "yellow",
              "Scene__Label--Green": labelColor === "green",
              "Scene__Label--Blue": labelColor === "blue",
              "Scene__Label--Purple": labelColor === "purple",
              "Scene__Label--Gray": labelColor === "gray"
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
          {!simplifiedRender && showCollisions && (
            <div className="Scene__Collisions">
              <SceneCollisions
                width={width}
                height={height}
                collisions={collisions}
              />
            </div>
          )}
          <SceneCursor
            sceneId={id}
            enabled={hovered}
            sceneFiltered={sceneFiltered}
          />
          {!simplifiedRender &&
            showEntities &&
            triggers.map((triggerId) => (
              <Trigger key={triggerId} id={triggerId} sceneId={id} />
            ))}
          {!simplifiedRender &&
            showEntities &&
            actors.map((actorId) => (
              <Actor key={actorId} id={actorId} sceneId={id} />
            ))}
          {!simplifiedRender && event && (
            <div className="Scene__EventHelper">
              <EventHelper event={event} scene={scene} />
            </div>
          )}
        </div>
        {selected && !simplifiedRender && (
          <div
            className="Scene__Info"
            onMouseDown={this.onStartDrag}
            style={{
              paddingLeft: labelOffsetLeft,
              paddingRight: labelOffsetRight
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
  simplifiedRender: PropTypes.bool.isRequired,
  labelOffsetLeft: PropTypes.number.isRequired,
  labelOffsetRight: PropTypes.number.isRequired
};

Scene.defaultProps = {
  image: null,
  event: null,
  prefab: null,
};

function mapStateToProps(state, props) {
  const { scene: sceneId, dragging: editorDragging, showLayers } = state.editor;

  const actorsLookup = getActorsLookup(state);
  const triggersLookup = getTriggersLookup(state);
  const backgroundsLookup = getBackgroundsLookup(state);
  const settings = getSettings(state);

  const scene = sceneSelectors.selectById(state.project.present.entities, props.id);

  const image = backgroundsLookup[scene.backgroundId];

  const sceneEventVisible =
    state.editor.eventId && state.editor.scene === props.id;
  const event =
    (sceneEventVisible &&
      normalizedFindSceneEvent(
        scene,
        actorsLookup,
        triggersLookup,
        state.editor.eventId
      )) ||
    null;

  const selected = sceneId === props.id;
  const dragging = selected && editorDragging;
  const hovered = state.editor.hover.sceneId === props.id;
  const tool = state.editor.tool;

  const { worldSidebarWidth: sidebarWidth } = state.settings;

  const {
    worldScrollX,
    worldScrollY,
    worldViewWidth,
    worldViewHeight,
    worldScrollThrottledX,
    worldScrollThrottledY,
    zoom,
  } = state.editor;
  const zoomRatio = zoom / 100;

  const viewBoundsX = worldScrollX / zoomRatio;
  const viewBoundsY = worldScrollY / zoomRatio;
  const viewBoundsWidth = (worldViewWidth - sidebarWidth) / zoomRatio;
  const viewBoundsHeight = worldViewHeight / zoomRatio;

  const viewBoundsThrottledX = worldScrollThrottledX / zoomRatio;
  const viewBoundsThrottledY = worldScrollThrottledY / zoomRatio;
  const viewBoundsThrottledWidth = (worldViewWidth - sidebarWidth) / zoomRatio;
  const viewBoundsThrottledHeight = worldViewHeight / zoomRatio;

  const visible =
    scene.x + scene.width * 8 > viewBoundsX &&
    scene.x < viewBoundsX + viewBoundsWidth &&
    scene.y + scene.height * 8 + 50 > viewBoundsY &&
    scene.y < viewBoundsY + viewBoundsHeight;

  const fullRender =
    scene.x + scene.width * 8 > viewBoundsThrottledX &&
    scene.x < viewBoundsThrottledX + viewBoundsThrottledWidth &&
    scene.y + scene.height * 8 + 50 > viewBoundsThrottledY &&
    scene.y < viewBoundsThrottledY + viewBoundsThrottledHeight;

  const offsetLabels = (scene.width * 8) > viewBoundsWidth / 2;
  const labelOffsetLeft = offsetLabels ? Math.min(Math.max(0, viewBoundsX - scene.x + 10), (scene.width * 8) - 100) : 0;
  const labelOffsetRight = offsetLabels ? Math.min(Math.max(0, (scene.x + (scene.width * 8) - 10) - (viewBoundsX + viewBoundsWidth)), (scene.width * 8) - 100) : 0;

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

  const palettesLookup = getPalettesLookup(state);
  const defaultBackgroundPaletteIds =
    settings.defaultBackgroundPaletteIds || [];
  const sceneBackgroundPaletteIds = scene.paletteIds || [];

  const getPalette = (paletteIndex) => {
    if(sceneBackgroundPaletteIds[paletteIndex] === "dmg") {
      return DMG_PALETTE;
    }
    return palettesLookup[sceneBackgroundPaletteIds[paletteIndex]]
      || palettesLookup[defaultBackgroundPaletteIds[paletteIndex]]
      || DMG_PALETTE;
  }

  const palettes = gbcEnabled
    ? getCachedObject([
        getPalette(0),
        getPalette(1),
        getPalette(2),
        getPalette(3),
        getPalette(4),
        getPalette(5),
      ])
    : dmgPalettes;

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
    simplifiedRender: !fullRender,
    palettes,
    showEntities,
    showCollisions,
    labelOffsetLeft,
    labelOffsetRight
  };
}

const mapDispatchToProps = {
  moveScene: entityActions.moveScene,
  selectScene: editorActions.selectScene,
  moveSelectedEntity: actions.moveSelectedEntity,
  sceneHover: editorActions.sceneHover,
};

export default connect(mapStateToProps, mapDispatchToProps)(Scene);
