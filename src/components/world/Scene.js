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
  BackgroundShape
} from "../../reducers/stateShape";
import { assetFilename } from "../../lib/helpers/gbstudio";
import SceneCursor from "./SceneCursor";
import {
  getSceneFrameCount,
  getActorsLookup,
  getTriggersLookup
} from "../../reducers/entitiesReducer";

window.React = React;
window.Component = Component;

const MAX_ACTORS = 9;
const MAX_TRIGGERS = 9;
const MAX_FRAMES = 25;
const TILE_SIZE = 8;

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

  onMouseMove = e => {
    const {
      id,
      zoomRatio,
      width,
      height,
      moveSelectedEntity,
      sceneHover
    } = this.props;
    const pos = getCoords(e.currentTarget);
    const x = e.pageX - pos.left;
    const y = e.pageY - pos.top;
    const tX = Math.floor(x / (8 * zoomRatio));
    const tY = Math.floor(y / (8 * zoomRatio));

    if (tX !== this.lastTX || tY !== this.lastTY) {
      if (tX >= 0 && tY >= 0 && tX < width && tY < height) {
        sceneHover(id, tX, tY);
        moveSelectedEntity(id, tX, tY);
      }
      this.lastTX = tX;
      this.lastTY = tY;
    }
  };

  onMouseLeave = e => {
    const { sceneHover } = this.props;
    sceneHover("");
  };

  onStartDrag = e => {
    const { id, selectScene } = this.props;
    this.lastPageX = e.pageX;
    this.lastPageY = e.pageY;

    selectScene(id);

    this.dragging = true;
  };

  onMoveDrag = e => {
    const { zoomRatio, moveScene, id, scene } = this.props;
    const { x, y } = scene;
    if (this.dragging) {
      const dragDeltaX = (e.pageX - this.lastPageX) / zoomRatio;
      const dragDeltaY = (e.pageY - this.lastPageY) / zoomRatio;

      this.lastPageX = e.pageX;
      this.lastPageY = e.pageY;

      moveScene(id, x + dragDeltaX, y + dragDeltaY);
    }
  };

  onEndDrag = e => {
    this.dragging = false;
  };

  render() {
    const {
      id,
      index,
      scene,
      image,
      event,
      width,
      height,
      projectRoot,
      showCollisions,
      selected,
      hovered,
      frameCount
    } = this.props;

    const { x, y, triggers = [], collisions = [], actors = [] } = scene;

    return (
      <div
        ref={this.containerRef}
        className={cx("Scene", { "Scene--Selected": selected })}
        style={{
          top: y,
          left: x
        }}
      >
        <div className="Scene__Name" onMouseDown={this.onStartDrag}>
          {scene.name || `Scene ${index + 1}`}
        </div>
        <div
          className="Scene__Image"
          onMouseMove={this.onMouseMove}
          onMouseLeave={this.onMouseLeave}
          style={{
            width: width * TILE_SIZE,
            height: height * TILE_SIZE
          }}
        >
          {image && (
            <img
              className="Scene__Background"
              alt=""
              src={`${assetFilename(projectRoot, "backgrounds", image)}?_v=${
                image._v
              }`}
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
          <SceneCursor sceneId={id} enabled={hovered} />
          {triggers.map(triggerId => (
            <Trigger key={triggerId} id={triggerId} sceneId={id} />
          ))}
          {actors.map(actorId => (
            <Actor key={actorId} id={actorId} sceneId={id} />
          ))}

          {event && (
            <div className="Scene__EventHelper">
              <EventHelper event={event} scene={scene} />
            </div>
          )}
        </div>
        <div className="Scene__Info" onMouseDown={this.onStartDrag}>
          <span
            title={`Number of actors in scene. This scene has used ${
              scene.actors.length
            } of ${MAX_ACTORS} available.`}
            className={cx({
              "Scene__Info--Warning": scene.actors.length === MAX_ACTORS,
              "Scene__Info--Error": scene.actors.length > MAX_ACTORS
            })}
          >
            A: {scene.actors.length}/{MAX_ACTORS}
          </span>
          {"\u00A0 \u00A0"}
          <span
            title={`Number of frames used by actors in scene. ${
              frameCount <= MAX_FRAMES
                ? `This scene has used ${frameCount} or ${MAX_FRAMES} available.`
                : `This scene is over available limits and may have rendering issues. ` +
                  `Try reducing number of actors in scene or use static and non animated ` +
                  `sprites where possible.`
            } Stay within limits to prevent tile data overwriting sprite data.`}
            className={cx({
              "Scene__Info--Warning": frameCount === MAX_FRAMES,
              "Scene__Info--Error": frameCount > MAX_FRAMES
            })}
          >
            F: {frameCount}/{MAX_FRAMES}
          </span>
          {"\u00A0 \u00A0"}
          <span
            title={`Number of triggers in scene. This scene has used ${
              scene.triggers.length
            } of ${MAX_TRIGGERS} available.`}
            className={cx({
              "Scene__Info--Warning": scene.triggers.length === MAX_TRIGGERS,
              "Scene__Info--Error": scene.triggers.length > MAX_TRIGGERS
            })}
          >
            T: {scene.triggers.length}/{MAX_TRIGGERS}
          </span>
        </div>
      </div>
    );
  }
}

Scene.propTypes = {
  index: PropTypes.number.isRequired,
  projectRoot: PropTypes.string.isRequired,
  scene: SceneShape.isRequired,
  event: EventShape,
  id: PropTypes.string.isRequired,
  image: BackgroundShape,
  prefab: PropTypes.shape({}),
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  selected: PropTypes.bool.isRequired,
  hovered: PropTypes.bool.isRequired,
  frameCount: PropTypes.number.isRequired,
  zoomRatio: PropTypes.number.isRequired,
  showCollisions: PropTypes.bool.isRequired,
  moveScene: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  moveSelectedEntity: PropTypes.func.isRequired,
  sceneHover: PropTypes.func.isRequired
};

Scene.defaultProps = {
  image: null,
  event: null,
  prefab: null
};

function mapStateToProps(state, props) {
  const { scene: sceneId, dragging: editorDragging } = state.editor;
  const scene = state.entities.present.entities.scenes[props.id];
  const actorsLookup = getActorsLookup(state);
  const triggersLookup = getTriggersLookup(state);
  const image = state.entities.present.entities.backgrounds[scene.backgroundId];
  const { settings } = state.entities.present.result;
  const event =
    (state.editor.eventId &&
      state.editor.scene === props.id &&
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
  const tool = state.tools.selected;

  return {
    scene,
    projectRoot: state.document && state.document.root,
    prefab: state.tools.prefab,
    event,
    image,
    width: image ? image.width : 32,
    height: image ? image.height : 32,
    showCollisions: settings.showCollisions || tool === "collisions",
    zoomRatio: (state.editor.zoom || 100) / 100,
    selected,
    dragging,
    hovered,
    frameCount: getSceneFrameCount(state, props)
  };
}

const mapDispatchToProps = {
  moveScene: actions.moveScene,
  selectScene: actions.selectScene,
  moveSelectedEntity: actions.moveSelectedEntity,
  sceneHover: actions.sceneHover
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Scene);
