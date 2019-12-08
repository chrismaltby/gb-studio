import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { PlusIcon, ResizeIcon, CloseIcon, BrickIcon } from "../library/Icons";
import { getScenesLookup } from "../../reducers/entitiesReducer";
import * as actions from "../../actions";
import { SceneShape } from "../../reducers/stateShape";

class SceneCursor extends Component {
  constructor() {
    super();
    this.state = {
      resize: false
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    if (e.code === "KeyP") {
      const { x, y, enabled, sceneId, editPlayerStartAt } = this.props;
      if (enabled) {
        editPlayerStartAt(sceneId, x, y);
      }
    }
  };

  onMouseDown = e => {
    const {
      x,
      y,
      tool,
      setTool,
      addActor,
      addTrigger,
      sceneId,
      scene,
      prefab,
      selectScene,
      showCollisions,
      addCollisionTile,
      removeCollisionTile,
      removeActorAt,
      removeTriggerAt
    } = this.props;


    if (tool === "actors") {
      addActor(sceneId, x, y, prefab);
      setTool("select");
    } else if (tool === "triggers") {
      addTrigger(sceneId, x, y, prefab);
      this.startX = x;
      this.startY = y;
      this.setState({ resize: true });
      window.addEventListener("mousemove", this.onResizeTrigger);
      window.addEventListener("mouseup", this.onResizeTriggerStop);
    } else if (tool === "collisions") {
      const collisionIndex = scene.width * y + x;
      const collisionByteIndex = collisionIndex >> 3;
      const collisionByteOffset = collisionIndex & 7;
      const collisionByteMask = 1 << collisionByteOffset;
      if (scene.collisions[collisionByteIndex] & collisionByteMask) {
        removeCollisionTile(sceneId, x, y);
        this.remove = true;
      } else {
        addCollisionTile(sceneId, x, y);
        this.remove = false;
      }
      window.addEventListener("mousemove", this.onCollisionsMove);
      window.addEventListener("mouseup", this.onCollisionsStop);
    } else if (tool === "eraser") {
      if (showCollisions) {
        removeCollisionTile(sceneId, x, y);
      }
      removeActorAt(sceneId, x, y);
      removeTriggerAt(sceneId, x, y);
      window.addEventListener("mousemove", this.onEraserMove);
      window.addEventListener("mouseup", this.onEraserStop);
    } else if (tool === "select") {
      selectScene(sceneId);
    }
  };

  onResizeTrigger = e => {
    const { x, y, sceneId, entityId, resizeTrigger } = this.props;
    if (entityId && (this.currentX !== x || this.currentY !== y)) {
      resizeTrigger(sceneId, entityId, this.startX, this.startY, x, y);
      this.currentX = x;
      this.currentY = y;
    }
  };

  onResizeTriggerStop = e => {
    const { setTool } = this.props;
    setTool("select");
    this.setState({ resize: false });
    window.removeEventListener("mousemove", this.onResizeTrigger);
    window.removeEventListener("mouseup", this.onResizeTriggerStop);
  };

  onCollisionsMove = e => {
    const {
      x,
      y,
      sceneId,
      addCollisionTile,
      removeCollisionTile
    } = this.props;
    if (this.currentX !== x || this.currentY !== y) {
      if (this.remove) {
        removeCollisionTile(sceneId, x, y);
      } else {
        addCollisionTile(sceneId, x, y);
      }
      this.currentX = x;
      this.currentY = y;
    }
  };

  onCollisionsStop = e => {
    window.removeEventListener("mousemove", this.onCollisionsMove);
    window.removeEventListener("mouseup", this.onCollisionsStop);
  };

  onEraserMove = e => {
    const { x, y, sceneId, showCollisions, removeCollisionTile } = this.props;
    if (this.currentX !== x || this.currentY !== y) {
      if (showCollisions) {
        removeCollisionTile(sceneId, x, y);
      }
      this.currentX = x;
      this.currentY = y;
    }
  };

  onEraserStop = e => {
    window.removeEventListener("mousemove", this.onEraserMove);
    window.removeEventListener("mouseup", this.onEraserStop);
  };

  render() {
    const { x, y, tool, enabled } = this.props;
    const { resize } = this.state;
    if (!enabled) {
      return <div />;
    }
    return (
      <div
        className={cx("SceneCursor", {
          "SceneCursor--AddActor": tool === "actors",
          "SceneCursor--AddTrigger": tool === "triggers",
          "SceneCursor--Eraser": tool === "eraser",
          "SceneCursor--Collisions": tool === "collisions"
        })}
        onMouseDown={this.onMouseDown}
        style={{
          top: y * 8,
          left: x * 8
        }}
      >
        {(tool === "actors" ||
          tool === "triggers" ||
          tool === "eraser" ||
          tool === "collisions") && (
          <div className="SceneCursor__AddBubble">
            {tool === "actors" && <PlusIcon />}
            {tool === "triggers" && (resize ? <ResizeIcon /> : <PlusIcon />)}
            {tool === "eraser" && <CloseIcon />}
            {tool === "collisions" && <BrickIcon />}
          </div>
        )}
      </div>
    );
  }
}

SceneCursor.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  entityId: PropTypes.string,
  prefab: PropTypes.shape(),
  sceneId: PropTypes.string.isRequired,
  scene: SceneShape.isRequired,
  showCollisions: PropTypes.bool.isRequired,
  enabled: PropTypes.bool.isRequired,
  tool: PropTypes.string.isRequired,
  setTool: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  addActor: PropTypes.func.isRequired,
  addTrigger: PropTypes.func.isRequired,
  addCollisionTile: PropTypes.func.isRequired,
  editPlayerStartAt: PropTypes.func.isRequired,
  resizeTrigger: PropTypes.func.isRequired,
  removeActorAt: PropTypes.func.isRequired,
  removeTriggerAt: PropTypes.func.isRequired,
  removeCollisionTile: PropTypes.func.isRequired
};

SceneCursor.defaultProps = {
  entityId: null,
  prefab: {}
};

function mapStateToProps(state, props) {
  const { selected: tool, prefab } = state.tools;
  const { x, y } = state.editor.hover;
  const { type: editorType, entityId } = state.editor;
  const showCollisions = state.entities.present.result.settings.showCollisions;
  const scenesLookup = getScenesLookup(state);
  const scene = scenesLookup[props.sceneId];
  return {
    x: x || 0,
    y: y || 0,
    tool,
    prefab,
    editorType,
    entityId,
    showCollisions,
    scene
  };
}

const mapDispatchToProps = {
  addActor: actions.addActor,
  removeActorAt: actions.removeActorAt,
  addCollisionTile: actions.addCollisionTile,
  removeCollisionTile: actions.removeCollisionTile,
  addTrigger: actions.addTrigger,
  removeTriggerAt: actions.removeTriggerAt,
  resizeTrigger: actions.resizeTrigger,
  selectScene: actions.selectScene,
  setTool: actions.setTool,
  editPlayerStartAt: actions.editPlayerStartAt,
  editDestinationPosition: actions.editDestinationPosition
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SceneCursor);
