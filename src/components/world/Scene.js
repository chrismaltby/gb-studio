import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import { throttle } from "lodash";
import * as actions from "../../actions";
import getCoords from "../../lib/helpers/getCoords";
import Actor from "./Actor";
import Trigger from "./Trigger";
import SceneCollisions from "./SceneCollisions";
import { findSceneEvent } from "../../lib/helpers/eventSystem";
import EventHelper from "./EventHelper";
import {
  SpriteShape,
  SceneShape,
  EventShape,
  BackgroundShape
} from "../../reducers/stateShape";
import { assetFilename } from "../../lib/helpers/gbstudio";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import SceneCursor from "./SceneCursor";
import { getSceneFrameCount } from "../../reducers/entitiesReducer";

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
    console.log("constructor: Scene");
    this.state = {
      hover: false,
      hoverX: 0,
      hoverY: 0
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("Scene", this.props, this.state, nextProps, nextState);
    return true;
  }

  componentDidMount() {
    window.addEventListener("mousemove", this.onMoveDrag);
    window.addEventListener("mouseup", this.onEndDrag);
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.onMoveDrag);
    window.removeEventListener("mouseup", this.onEndDrag);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  // shouldComponentUpdate(nextProps) {
  //   const { scene, sceneId } = this.props;
  //   return nextProps.scene !== scene || scene.id === sceneId;
  // }

  onKeyDown = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    if (e.key === "p") {
      const { hoverX, hoverY, hover } = this.state;
      if (hover) {
        const { id, editPlayerStartAt } = this.props;
        editPlayerStartAt(id, hoverX, hoverY);
      }
    }
  };

  onMouseMove = e => {
    const {
      id,
      tool,
      showCollisions,
      zoomRatio,
      width,
      height,
      removeCollisionTile,
      addCollisionTile,
      resizeTrigger,
      moveSelectedEntity,
      sceneHover
    } = this.props;
    const { creating, downX, downY, hover } = this.state;

    const pos = getCoords(e.currentTarget);
    const x = e.pageX - pos.left;
    const y = e.pageY - pos.top;
    const tX = Math.floor(x / (8 * zoomRatio));
    const tY = Math.floor(y / (8 * zoomRatio));

    if (tX !== this.lastTX || tY !== this.lastTY) {
      if (creating) {
        if (tool === "collisions") {
          if (this.remove) {
            removeCollisionTile(id, tX, tY);
          } else {
            addCollisionTile(id, tX, tY);
          }
        } else if (tool === "triggers") {
          resizeTrigger(id, entityId, downX, downY, tX, tY);
        } else if (tool === "eraser") {
          if (showCollisions) {
            removeCollisionTile(id, tX, tY);
          }
        }
      }

      // const actor = this.actorAt(tX, tY);

      if (tX >= 0 && tY >= 0 && tX < width && tY < height) {
        sceneHover(id, tX, tY);
        moveSelectedEntity(id, tX, tY);

        // this.setStatus({
        //   sceneName: scene.name,
        //   x: tX,
        //   y: tY,
        //   actor: null
        // });

        // this.setState({
        //   hover: true,
        //   hoverX: tX,
        //   hoverY: tY
        // });

        // console.log(dragging);

        // if (dragging) {
        //   moveSelectedEntity(id, tX, tY);
        // }

        // if (playerDragging) {
        //   editPlayerStartAt(id, tX, tY);
        // } else if (destinationDragging) {
        //   /*
        //   editDestinationPosition(
        //     destinationDragging,
        //     sceneId,
        //     editorType,
        //     entityId,
        //     id,
        //     tX,
        //     tY
        //   );
        //   */
        // } else if (dragging === DRAG_ACTOR) {
        //   moveActor(sceneId, entityId, id, tX, tY);
        // } else if (triggerDragging) {
        //   // moveTrigger(sceneId, entityId, id, tX, tY);
        // }
      }

      this.lastTX = tX;
      this.lastTY = tY;
    }
  };

  setStatus = throttle(options => {
    const { setStatus } = this.props;
    setStatus(options);
  }, 200);

  onMouseDown = e => {
    const {
      id,
      tool,
      scene,
      width,
      showCollisions,
      dragActorStart,
      dragTriggerStart,
      selectScene,
      addActor,
      removeCollisionTile,
      addCollisionTile,
      setTool,
      addTrigger,
      removeActorAt,
      removeTriggerAt,
      prefab,
      selected
    } = this.props;

    console.log("MOUSE DOWN SCENE");

    selectScene(id);

    /*
    const { hoverX, hoverY } = this.state;

    const trigger = this.triggerAt(hoverX, hoverY);
    const actor = this.actorAt(hoverX, hoverY);

    if (actor) {
      dragActorStart(id, actor.id, scene.actors.indexOf(actor));
    } else if (trigger) {
      dragTriggerStart(id, trigger.id, scene.triggers.indexOf(trigger));
    }

    if (tool === "select") {
      if (!trigger && !actor) {
        selectScene(id);
      }
    } else if (tool === "actors") {
      if (!actor && scene.actors.length < MAX_ACTORS) {
        addActor(id, hoverX, hoverY, prefab);
      }
    } else if (tool === "collisions") {
      if (!trigger && !actor) {
        const collisionIndex = width * hoverY + hoverX;
        const collisionByteIndex = collisionIndex >> 3;
        const collisionByteOffset = collisionIndex & 7;
        const collisionByteMask = 1 << collisionByteOffset;
        if (scene.collisions[collisionByteIndex] & collisionByteMask) {
          removeCollisionTile(id, hoverX, hoverY);
          this.remove = true;
        } else {
          addCollisionTile(id, hoverX, hoverY);
          this.remove = false;
        }
      } else {
        setTool("select");
      }
    } else if (tool === "triggers") {
      if (!trigger && scene.triggers.length < MAX_TRIGGERS) {
        addTrigger(id, hoverX, hoverY, prefab);
      }
    } else if (tool === "eraser") {
      if (showCollisions) {
        removeCollisionTile(id, hoverX, hoverY);
      }
      removeActorAt(id, hoverX, hoverY);
      removeTriggerAt(id, hoverX, hoverY);
      this.remove = true;
    }
    this.setState({
      creating: true,
      downX: hoverX,
      downY: hoverY
    });
    */
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
    // const { dragging, dragX, dragY } = this.state;
    if (this.dragging) {
      const dragDeltaX = (e.pageX - this.lastPageX) / zoomRatio;
      const dragDeltaY = (e.pageY - this.lastPageY) / zoomRatio;

      this.lastPageX = e.pageX;
      this.lastPageY = e.pageY;

      moveScene(id, x + dragDeltaX, y + dragDeltaY);

      // this.setState({
      //   dragX: dragX + dragDeltaX,
      //   dragY: dragY + dragDeltaY
      // });
    }
  };

  // // eslint-disable-next-line react/sort-comp
  // dragScene = throttle((dragX, dragY) => {
  //   const { dragScene } = this.props;
  //   return dragScene(dragX, dragY);
  // }, 50);

  onEndDrag = e => {
    this.dragging = false;
    // const { id, tool, moveScene, dragSceneStop, setTool } = this.props;
    // const { dragging, creating, dragX, dragY } = this.state;
    // if (dragging) {
    //   moveScene(id, dragX, dragY);
    //   dragSceneStop();
    // } else if (creating && (tool === "actors" || tool === "triggers")) {
    //   setTool("select");
    // }
    // if (dragging || creating) {
    //   this.setState({
    //     dragging: false,
    //     creating: false,
    //     dragX: 0,
    //     dragY: 0
    //   });
    // }
  };

  triggerAt = (x, y) => {
    const { scene } = this.props;
    const { triggers = [] } = scene;
    return triggers.find(
      trigger =>
        x >= trigger.x &&
        x < trigger.x + (trigger.width || 1) &&
        y >= trigger.y &&
        y < trigger.y + (trigger.height || 1)
    );
  };

  actorAt = (x, y) => {
    const { scene } = this.props;
    const { actors = [] } = scene;
    return actors.find(
      actor => x >= actor.x && x < actor.x + 2 && y === actor.y
    );
  };

  render() {
    const {
      id,
      index,
      scene,
      // sprites,
      // tool,
      // editorType,
      // entityId,
      // sceneId,
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

    console.log("render: Scene.js");

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
        <div
          className="Scene__Name"
          onMouseDown={this.onStartDrag}
          onMouseMove={this.onMoveDrag}
          onMouseUp={this.onEndDrag}
        >
          {scene.name || `Scene ${index + 1}`}
        </div>
        <div
          className="Scene__Image"
          onMouseMove={this.onMouseMove}
          onMouseDown={this.onMouseDown}
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
        <div
          className="Scene__Info"
          onMouseDown={this.onStartDrag}
          onMouseMove={this.onMoveDrag}
          onMouseUp={this.onEndDrag}
        >
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
  // sprites: PropTypes.arrayOf(SpriteShape).isRequired,
  projectRoot: PropTypes.string.isRequired,
  scene: SceneShape.isRequired,
  event: EventShape,
  // editorType: PropTypes.string,
  // entityId: PropTypes.string,
  // sceneId: PropTypes.string,
  id: PropTypes.string.isRequired,
  image: BackgroundShape,
  tool: PropTypes.oneOf([
    "triggers",
    "actors",
    "collisions",
    "scene",
    "eraser",
    "select"
  ]).isRequired,
  prefab: PropTypes.shape({}),
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  selected: PropTypes.bool.isRequired,
  hovered: PropTypes.bool.isRequired,
  frameCount: PropTypes.number.isRequired,
  zoomRatio: PropTypes.number.isRequired,
  showCollisions: PropTypes.bool.isRequired,
  moveScene: PropTypes.func.isRequired,
  addActor: PropTypes.func.isRequired,
  removeActorAt: PropTypes.func.isRequired,
  addCollisionTile: PropTypes.func.isRequired,
  removeCollisionTile: PropTypes.func.isRequired,
  addTrigger: PropTypes.func.isRequired,
  removeTriggerAt: PropTypes.func.isRequired,
  resizeTrigger: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  setTool: PropTypes.func.isRequired,
  setStatus: PropTypes.func.isRequired,
  editPlayerStartAt: PropTypes.func.isRequired,
  dragActorStart: PropTypes.func.isRequired,
  dragTriggerStart: PropTypes.func.isRequired,
  moveSelectedEntity: PropTypes.func.isRequired,
  sceneHover: PropTypes.func.isRequired
};

Scene.defaultProps = {
  image: null,
  event: null,
  prefab: null
};

function mapStateToProps(state, props) {
  const {
    type: editorType,
    entityId,
    scene: sceneId,
    actorDragging,
    dragging: editorDragging
  } = state.editor;
  const scene = state.entities.present.entities.scenes[props.id];
  const image = state.entities.present.entities.backgrounds[scene.backgroundId];
  const sprites = state.project.present.spriteSheets;
  const event =
    (state.editor.eventId &&
      state.editor.scene === props.id &&
      findSceneEvent(scene, state.editor.eventId)) ||
    null;
  const selected = sceneId === props.id;
  const dragging = selected && editorDragging;
  const hovered = state.editor.hover.sceneId === props.id;

  return {
    scene,
    // editorType,
    // entityId,
    // sceneId,
    projectRoot: state.document && state.document.root,
    tool: "select",
    prefab: state.tools.prefab,
    // editor: state.editor,
    event,
    image,
    width: image ? image.width : 32,
    height: image ? image.height : 32,
    worldId: state.project.present.id,
    showCollisions:
      (state.project.present.settings &&
        state.project.present.settings.showCollisions) ||
      state.tools.selected === "collisions",
    zoomRatio: (state.editor.zoom || 100) / 100,
    selected,
    dragging,
    hovered,
    // playerDragging: state.editor.playerDragging || false,
    // destinationDragging: state.editor.destinationDragging,
    // actorDragging: state.editor.actorDragging || false,
    // triggerDragging: state.editor.triggerDragging || false,
    sprites,
    frameCount: getSceneFrameCount(state, props)
  };
}

const mapDispatchToProps = {
  moveScene: actions.moveScene,
  addActor: actions.addActor,
  moveActor: actions.moveActor,
  removeActorAt: actions.removeActorAt,
  addCollisionTile: actions.addCollisionTile,
  removeCollisionTile: actions.removeCollisionTile,
  addTrigger: actions.addTrigger,
  removeTriggerAt: actions.removeTriggerAt,
  resizeTrigger: actions.resizeTrigger,
  moveTrigger: actions.moveTrigger,
  selectScene: actions.selectScene,
  setTool: actions.setTool,
  setStatus: actions.setStatus,
  dragScene: actions.dragScene,
  dragSceneStart: actions.dragSceneStart,
  dragSceneStop: actions.dragSceneStop,
  editPlayerStartAt: actions.editPlayerStartAt,
  editDestinationPosition: actions.editDestinationPosition,
  dragActorStart: actions.dragActorStart,
  dragTriggerStart: actions.dragTriggerStart,
  moveSelectedEntity: actions.moveSelectedEntity,
  sceneHover: actions.sceneHover
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Scene);
