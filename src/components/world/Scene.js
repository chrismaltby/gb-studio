import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import * as actions from "../../actions";
import getCoords from "../../lib/helpers/getCoords";
import Actor from "./Actor";
import SceneCollisions from "./SceneCollisions";
import { throttle } from "lodash";
import { findSceneEvent } from "../../lib/helpers/eventSystem";
import EventHelper from "./EventHelper";

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

  /*
  componentDidUpdate(prevProps) {
    if (this.props.selected && this.props.selected !== prevProps.selected) {
      // Scroll scene into view when selected
      this.containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      });
    }
  }
  */

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
        const { id } = this.props;
        this.props.editPlayerStartAt(id, hoverX, hoverY);
      }
    }
  };

  onMouseMove = e => {
    const {
      id,
      tool,
      editor,
      scene,
      showCollisions,
      zoomRatio,
      width,
      height,
      playerDragging,
      destinationDragging
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
            this.props.removeCollisionTile(id, tX, tY);
          } else {
            this.props.addCollisionTile(id, tX, tY);
          }
        } else if (tool === "triggers") {
          this.props.resizeTrigger(id, 0, downX, downY, tX, tY);
        } else if (tool === "eraser") {
          if (showCollisions) {
            this.props.removeCollisionTile(id, tX, tY);
          }
        } else if (tool === "select") {
          if (editor.type === "triggers") {
            this.props.moveTrigger(
              id,
              editor.index,
              tX - this.state.hoverX,
              tY - this.state.hoverY
            );
          } else if (editor.type === "actors") {
            this.props.moveActor(
              id,
              editor.index,
              tX - this.state.hoverX,
              tY - this.state.hoverY
            );
          }
        }
      }

      let actor = this.actorAt(tX, tY);

      if (tX >= 0 && tY >= 0 && tX < width && tY < height) {
        this.setStatus({
          sceneName: scene.name,
          x: tX,
          y: tY,
          actor:
            actor &&
            (actor.name || "Actor " + (scene.actors.indexOf(actor) + 1))
        });

        this.setState({
          hover: true,
          hoverX: tX,
          hoverY: tY
        });

        if (playerDragging) {
          const { id } = this.props;
          this.props.editPlayerStartAt(id, tX, tY);
        } else if (destinationDragging) {
          const { id, editor } = this.props;
          this.props.editDestinationPosition(
            destinationDragging,
            editor.scene,
            editor.type,
            editor.index,
            id,
            tX,
            tY
          );
        }
      }

      this.lastTX = tX;
      this.lastTY = tY;
    }
  };

  setStatus = throttle(options => {
    this.props.setStatus(options);
  }, 200);

  onMouseDown = e => {
    const { id, tool, scene, width, showCollisions } = this.props;
    const { hoverX, hoverY } = this.state;

    let trigger = this.triggerAt(hoverX, hoverY);
    let actor = this.actorAt(hoverX, hoverY);

    if (trigger) {
      this.props.selectTrigger(id, scene.triggers.indexOf(trigger));
    } else if (actor) {
      this.props.selectActor(id, scene.actors.indexOf(actor));
    }

    if (tool === "select") {
      if (!trigger && !actor) {
        this.props.selectScene(id);
      }
    } else if (tool === "actors") {
      if (!actor) {
        this.props.addActor(id, hoverX, hoverY);
      }
    } else if (tool === "collisions") {
      if (!trigger && !actor) {
        const collisionIndex = width * hoverY + hoverX;
        const collisionByteIndex = collisionIndex >> 3;
        const collisionByteOffset = collisionIndex & 7;
        const collisionByteMask = 1 << collisionByteOffset;
        if (scene.collisions[collisionByteIndex] & collisionByteMask) {
          this.props.removeCollisionTile(id, hoverX, hoverY);
          this.remove = true;
        } else {
          this.props.addCollisionTile(id, hoverX, hoverY);
          this.remove = false;
        }
      }
    } else if (tool === "triggers") {
      if (!trigger) {
        this.props.addTrigger(id, hoverX, hoverY);
      }
    } else if (tool === "eraser") {
      if (showCollisions) {
        this.props.removeCollisionTile(id, hoverX, hoverY);
      }
      this.props.removeActorAt(id, hoverX, hoverY);
      this.props.removeTriggerAt(id, hoverX, hoverY);
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
    const { id } = this.props;
    this.lastPageX = e.pageX;
    this.lastPageY = e.pageY;
    this.setState({
      dragging: true,
      dragX: 0,
      dragY: 0
    });
    this.props.selectScene(id);
    this.props.dragSceneStart();
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

  dragScene = throttle(
    (dragX, dragY) => this.props.dragScene(dragX, dragY),
    50
  );

  onEndDrag = e => {
    const { id, tool } = this.props;
    const { dragging, creating, dragX, dragY } = this.state;
    if (dragging) {
      this.props.moveScene(id, dragX, dragY);
      this.props.dragSceneStop();
    } else if (creating && (tool === "actors" || tool === "triggers")) {
      this.props.setTool("select");
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
      editor,
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
          {scene.name || "Scene " + (index + 1)}
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
          {triggers.map((trigger, index) => (
            <div
              key={index}
              className={cx("Scene__Trigger", {
                "Scene__Trigger--Selected":
                  editor.type === "triggers" &&
                  editor.scene === id &&
                  editor.index === index
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
          {actors.map((actor, index) => (
            <Actor
              key={index}
              x={actor.x}
              y={actor.y}
              actor={actor}
              selected={
                editor.type === "actors" &&
                editor.scene === id &&
                editor.index === index
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
              "Scene__Info--Warning": scene.actors.length >= MAX_ACTORS
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
              "Scene__Info--Warning": framesLength == MAX_FRAMES,
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
              "Scene__Info--Warning": scene.triggers.length >= MAX_TRIGGERS
            })}
          >
            T: {scene.triggers.length}/{MAX_TRIGGERS}
          </span>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const image = state.project.present.backgrounds.find(
    background => background.id === props.scene.backgroundId
  );
  const sprites = state.project.present.spriteSheets;
  return {
    projectRoot: state.document && state.document.root,
    tool: state.tools.selected,
    editor: state.editor,
    event:
      state.editor.eventId &&
      state.editor.scene === props.id &&
      findSceneEvent(props.scene, state.editor.eventId),
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
    selected: state.editor.scene === props.id,
    playerDragging: state.editor.playerDragging,
    destinationDragging: state.editor.destinationDragging,
    sprites
  };
}

const mapDispatchToProps = {
  moveScene: actions.moveScene,
  addActor: actions.addActor,
  selectActor: actions.selectActor,
  moveActor: actions.moveActor,
  removeActorAt: actions.removeActorAt,
  addCollisionTile: actions.addCollisionTile,
  removeCollisionTile: actions.removeCollisionTile,
  addTrigger: actions.addTrigger,
  removeTriggerAt: actions.removeTriggerAt,
  resizeTrigger: actions.resizeTrigger,
  moveTrigger: actions.moveTrigger,
  selectTrigger: actions.selectTrigger,
  selectScene: actions.selectScene,
  setTool: actions.setTool,
  setStatus: actions.setStatus,
  dragScene: actions.dragScene,
  dragSceneStart: actions.dragSceneStart,
  dragSceneStop: actions.dragSceneStop,
  editPlayerStartAt: actions.editPlayerStartAt,
  editDestinationPosition: actions.editDestinationPosition
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Scene);
