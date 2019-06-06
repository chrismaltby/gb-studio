import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import { throttle } from "lodash";
import * as actions from "../../actions";
import getCoords from "../../lib/helpers/getCoords";
import Actor from "./Actor";
import SceneCollisions from "./SceneCollisions";
import { findSceneEvent } from "../../lib/helpers/eventSystem";
import EventHelper from "./EventHelper";
import { SpriteShape, SceneShape, EventShape } from "../../reducers/stateShape";

const MAX_ACTORS = 9;
const MAX_TRIGGERS = 9;
const MAX_FRAMES = 25;
const TILE_SIZE = 8;

class Scene extends Component {
  constructor() {
    super();
    this.containerRef = React.createRef();
    this.state = {
      hover: false,
      hoverX: 0,
      hoverY: 0,
      dragX: 0,
      dragY: 0
    };
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
      sceneId,
      entityId,
      editorType,
      scene,
      showCollisions,
      zoomRatio,
      width,
      height,
      playerDragging,
      destinationDragging,
      actorDragging,
      triggerDragging,
      removeCollisionTile,
      addCollisionTile,
      resizeTrigger,
      editPlayerStartAt,
      editDestinationPosition,
      moveActor,
      moveTrigger
    } = this.props;
    const { creating, downX, downY } = this.state;

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

      const actor = this.actorAt(tX, tY);

      if (tX >= 0 && tY >= 0 && tX < width && tY < height) {
        this.setStatus({
          sceneName: scene.name,
          x: tX,
          y: tY,
          actor:
            actor && (actor.name || `Actor ${scene.actors.indexOf(actor) + 1}`)
        });

        this.setState({
          hover: true,
          hoverX: tX,
          hoverY: tY
        });

        if (playerDragging) {
          editPlayerStartAt(id, tX, tY);
        } else if (destinationDragging) {
          editDestinationPosition(
            destinationDragging,
            sceneId,
            editorType,
            entityId,
            id,
            tX,
            tY
          );
        } else if (actorDragging) {
          moveActor(sceneId, entityId, id, tX, tY);
        } else if (triggerDragging) {
          moveTrigger(sceneId, entityId, id, tX, tY);
        }
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
      prefab
    } = this.props;
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
  };

  onMouseLeave = e => {
    this.setStatus({});
    this.setState({
      hover: false
    });
  };

  onStartDrag = e => {
    const { id, selectScene, dragSceneStart } = this.props;
    this.lastPageX = e.pageX;
    this.lastPageY = e.pageY;
    this.setState({
      dragging: true,
      dragX: 0,
      dragY: 0
    });
    selectScene(id);
    dragSceneStart();
  };

  onMoveDrag = e => {
    const { zoomRatio } = this.props;
    const { dragging, dragX, dragY } = this.state;
    if (dragging) {
      const dragDeltaX = (e.pageX - this.lastPageX) / zoomRatio;
      const dragDeltaY = (e.pageY - this.lastPageY) / zoomRatio;

      this.lastPageX = e.pageX;
      this.lastPageY = e.pageY;

      this.dragScene(dragX, dragY);

      this.setState({
        dragX: dragX + dragDeltaX,
        dragY: dragY + dragDeltaY
      });
    }
  };

  // eslint-disable-next-line react/sort-comp
  dragScene = throttle((dragX, dragY) => {
    const { dragScene } = this.props;
    return dragScene(dragX, dragY);
  }, 50);

  onEndDrag = e => {
    const { id, tool, moveScene, dragSceneStop, setTool } = this.props;
    const { dragging, creating, dragX, dragY } = this.state;
    if (dragging) {
      moveScene(id, dragX, dragY);
      dragSceneStop();
    } else if (creating && (tool === "actors" || tool === "triggers")) {
      setTool("select");
    }
    this.setState({
      dragging: false,
      creating: false,
      dragX: 0,
      dragY: 0
    });
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
      sprites,
      tool,
      editorType,
      entityId,
      sceneId,
      image,
      version,
      event,
      width,
      height,
      projectRoot,
      showCollisions,
      selected
    } = this.props;
    const { x, y, triggers = [], collisions = [], actors = [] } = scene;

    const { hover, hoverX, hoverY, dragX, dragY } = this.state;

    const uniqueSprites = scene.actors.reduce((memo, actor) => {
      const spriteSheet = sprites.find(
        sprite => sprite.id === actor.spriteSheetId
      );
      if (memo.indexOf(spriteSheet) === -1) {
        memo.push(spriteSheet);
      }
      return memo;
    }, []);

    const framesLength = uniqueSprites.reduce((memo, spriteSheet) => {
      return memo + (spriteSheet ? spriteSheet.numFrames : 0);
    }, 0);

    return (
      <div
        ref={this.containerRef}
        className={cx("Scene", { "Scene--Selected": selected })}
        style={{
          top: y + dragY,
          left: x + dragX
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
          <img
            className="Scene__Background"
            alt=""
            src={`${projectRoot}/assets/backgrounds/${image}?v=${version}`}
          />
          {triggers.map(trigger => (
            <div
              key={trigger.id}
              className={cx("Scene__Trigger", {
                "Scene__Trigger--Selected":
                  editorType === "triggers" &&
                  sceneId === id &&
                  entityId === trigger.id
              })}
              style={{
                top: trigger.y * 8,
                left: trigger.x * 8,
                width: Math.max(trigger.width, 1) * 8,
                height: Math.max(trigger.height, 1) * 8
              }}
            />
          ))}
          {showCollisions && (
            <div className="Scene__Collisions">
              <SceneCollisions
                width={width}
                height={height}
                collisions={collisions}
              />
            </div>
          )}
          {actors.map(actor => (
            <Actor
              key={actor.id}
              x={actor.x}
              y={actor.y}
              actor={actor}
              selected={
                editorType === "actors" &&
                sceneId === id &&
                entityId === actor.id
              }
            />
          ))}
          {tool === "actors" && hover && (
            <div className="Scene__Ghost">
              <Actor x={hoverX} y={hoverY} />
            </div>
          )}
          {hover && (
            <div
              className="Scene__Hover"
              style={{
                top: hoverY * 8,
                left: hoverX * 8
              }}
            />
          )}
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
              framesLength <= MAX_FRAMES
                ? `This scene has used ${framesLength} or ${MAX_FRAMES} available.`
                : `This scene is over available limits and may have rendering issues. ` +
                  `Try reducing number of actors in scene or use static and non animated ` +
                  `sprites where possible.`
            } Stay within limits to prevent tile data overwriting sprite data.`}
            className={cx({
              "Scene__Info--Warning": framesLength === MAX_FRAMES,
              "Scene__Info--Error": framesLength > MAX_FRAMES
            })}
          >
            F: {framesLength}/{MAX_FRAMES}
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
  sprites: PropTypes.arrayOf(SpriteShape).isRequired,
  projectRoot: PropTypes.string.isRequired,
  scene: SceneShape.isRequired,
  event: EventShape,
  editorType: PropTypes.string,
  entityId: PropTypes.string,
  sceneId: PropTypes.string,
  id: PropTypes.string.isRequired,
  image: PropTypes.string,
  version: PropTypes.number,
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
  playerDragging: PropTypes.bool.isRequired,
  actorDragging: PropTypes.bool.isRequired,
  triggerDragging: PropTypes.bool.isRequired,
  destinationDragging: PropTypes.string,
  zoomRatio: PropTypes.number.isRequired,
  showCollisions: PropTypes.bool.isRequired,
  moveScene: PropTypes.func.isRequired,
  addActor: PropTypes.func.isRequired,
  moveActor: PropTypes.func.isRequired,
  removeActorAt: PropTypes.func.isRequired,
  addCollisionTile: PropTypes.func.isRequired,
  removeCollisionTile: PropTypes.func.isRequired,
  addTrigger: PropTypes.func.isRequired,
  removeTriggerAt: PropTypes.func.isRequired,
  resizeTrigger: PropTypes.func.isRequired,
  moveTrigger: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  setTool: PropTypes.func.isRequired,
  setStatus: PropTypes.func.isRequired,
  dragScene: PropTypes.func.isRequired,
  dragSceneStart: PropTypes.func.isRequired,
  dragSceneStop: PropTypes.func.isRequired,
  editPlayerStartAt: PropTypes.func.isRequired,
  editDestinationPosition: PropTypes.func.isRequired,
  dragActorStart: PropTypes.func.isRequired,
  dragTriggerStart: PropTypes.func.isRequired
};

Scene.defaultProps = {
  editorType: "",
  entityId: "",
  sceneId: "",
  image: "",
  destinationDragging: "",
  version: 0,
  event: null,
  prefab: null
};

function mapStateToProps(state, props) {
  const { type: editorType, entityId, scene: sceneId } = state.editor;
  const image = state.project.present.backgrounds.find(
    background => background.id === props.scene.backgroundId
  );
  const sprites = state.project.present.spriteSheets;
  const event =
    (state.editor.eventId &&
      state.editor.scene === props.id &&
      findSceneEvent(props.scene, state.editor.eventId)) ||
    null;
  return {
    editorType,
    entityId,
    sceneId,
    projectRoot: state.document && state.document.root,
    tool: state.tools.selected,
    prefab: state.tools.prefab,
    editor: state.editor,
    event,
    image: image && image.filename,
    version: (image && image._v) || 0,
    width: image ? image.width : 32,
    height: image ? image.height : 32,
    worldId: state.project.present.id,
    showCollisions:
      (state.project.present.settings &&
        state.project.present.settings.showCollisions) ||
      state.tools.selected === "collisions",
    zoomRatio: (state.editor.zoom || 100) / 100,
    selected: sceneId === props.id,
    playerDragging: state.editor.playerDragging || false,
    destinationDragging: state.editor.destinationDragging,
    actorDragging: state.editor.actorDragging || false,
    triggerDragging: state.editor.triggerDragging || false,
    sprites
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
  dragTriggerStart: actions.dragTriggerStart
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Scene);
