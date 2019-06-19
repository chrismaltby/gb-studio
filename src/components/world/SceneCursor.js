import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { PlusIcon, ResizeIcon, CloseIcon } from "../library/Icons";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { getSpriteSheetIds } from "../../reducers/entitiesReducer";
import * as actions from "../../actions";

class SceneCursor extends Component {
  constructor() {
    super();
    this.state = {
      resize: false
    };
  }

  onMouseDown = e => {
    const {
      x,
      y,
      tool,
      setTool,
      addActor,
      addTrigger,
      sceneId,
      showCollisions,
      removeCollisionTile,
      removeActorAt,
      removeTriggerAt
    } = this.props;

    e.stopPropagation();
    e.preventDefault();

    if (tool === "actors") {
      addActor(sceneId, x, y);
      setTool("select");
    } else if (tool === "triggers") {
      addTrigger(sceneId, x, y);
      this.startX = x;
      this.startY = y;
      this.setState({ resize: true });
      window.addEventListener("mousemove", this.onResizeTrigger);
      window.addEventListener("mouseup", this.onResizeTriggerStop);
    } else if (tool === "eraser") {
      if (showCollisions) {
        removeCollisionTile(sceneId, x, y);
      }
      removeActorAt(sceneId, x, y);
      removeTriggerAt(sceneId, x, y);
      window.addEventListener("mousemove", this.onEraserMove);
      window.addEventListener("mouseup", this.onEraserStop);
    }
  };

  onResizeTrigger = e => {
    const { x, y, sceneId, entityId, resizeTrigger } = this.props;
    if (this.currentX !== x || this.currentY !== y) {
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
    const { x, y, tool, spriteSheetId, enabled } = this.props;
    const { resize } = this.state;
    if (!enabled) {
      return <div />;
    }
    return (
      <div
        className={cx("SceneCursor", {
          "SceneCursor--AddActor": tool === "actors",
          "SceneCursor--AddTrigger": tool === "triggers",
          "SceneCursor--Eraser": tool === "eraser"
        })}
        onMouseDown={this.onMouseDown}
        style={{
          top: y * 8,
          left: x * 8
        }}
      >
        {(tool === "actors" || tool === "triggers" || tool === "eraser") && (
          <div className="SceneCursor__AddBubble">
            {tool === "actors" && <PlusIcon />}
            {tool === "triggers" && (resize ? <ResizeIcon /> : <PlusIcon />)}
            {tool === "eraser" && <CloseIcon />}
          </div>
        )}
        {tool === "actors" && (
          <div className="SceneCursor__Sprite">
            <SpriteSheetCanvas spriteSheetId={spriteSheetId} />
          </div>
        )}
      </div>
    );
  }
}

SceneCursor.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  sceneId: PropTypes.string.isRequired,
  showCollisions: PropTypes.bool.isRequired,
  tool: PropTypes.string.isRequired,
  setTool: PropTypes.func.isRequired,
  addActor: PropTypes.func.isRequired,
  addTrigger: PropTypes.func.isRequired,
  addCollisionTile: PropTypes.func.isRequired,
  removeActorAt: PropTypes.func.isRequired,
  removeTriggerAt: PropTypes.func.isRequired,
  removeCollisionTile: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
  const { selected: tool, prefab } = state.tools;
  const { x, y } = state.editor.hover;
  const { type: editorType, entityId } = state.editor;
  const showCollisions = state.entities.present.result.settings.showCollisions;
  const spriteSheetIds = getSpriteSheetIds(state);
  const spriteSheetId = spriteSheetIds[0];
  return {
    x,
    y,
    tool,
    prefab,
    editorType,
    entityId,
    showCollisions,
    spriteSheetId
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
)(SceneCursor);
