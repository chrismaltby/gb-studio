import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { PlusIcon, ResizeIcon } from "../library/Icons";

class SceneCursor extends Component {
  constructor() {
    super();
    this.state = {
      resize: false
    };
  }

  onMouseDown = e => {
    const { x, y, tool, setTool, addActor, addTrigger, sceneId } = this.props;

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
      window.addEventListener("mousemove", this.onMouseMove);
      window.addEventListener("mouseup", this.onMouseUp);
    }
  };

  onMouseMove = e => {
    const { x, y, sceneId, entityId, resizeTrigger } = this.props;
    if (this.currentX !== x || this.currentY !== y) {
      resizeTrigger(sceneId, entityId, this.startX, this.startY, x, y);
      this.currentX = x;
      this.currentY = y;
    }
  };

  onMouseUp = e => {
    const { setTool } = this.props;
    setTool("select");
    this.setState({ resize: false });
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  };

  render() {
    const { x, y, tool } = this.props;
    const { resize } = this.state;
    return (
      <div
        className={cx("SceneCursor", {
          "SceneCursor--AddActor": tool === "actors",
          "SceneCursor--AddTrigger": tool === "triggers"
        })}
        onMouseDown={this.onMouseDown}
        style={{
          top: y * 8,
          left: x * 8
        }}
      >
        {(tool === "actors" || tool === "triggers") && (
          <div className="SceneCursor__AddBubble">
            {resize ? <ResizeIcon /> : <PlusIcon />}
          </div>
        )}
      </div>
    );
  }
}

SceneCursor.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  tool: PropTypes.string.isRequired
};

function mapStateToProps(state, props) {
  const { selected: tool, prefab } = state.tools;
  const { x, y } = state.editor.hover;
  const { type: editorType, entityId } = state.editor;
  return {
    x,
    y,
    tool,
    prefab,
    editorType,
    entityId
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
