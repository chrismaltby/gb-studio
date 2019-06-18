import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { PlusIcon } from "../library/Icons";

class SceneCursor extends Component {
  // componentDidMount() {
  //   window.addEventListener("mousedown", this.onMouseDown);
  // }

  // componentWillUnmount() {
  //   window.removeEventListener("mousedown", this.onMouseDown);
  // }

  onMouseDown = e => {
    const { x, y, tool, setTool, addActor, addTrigger, sceneId } = this.props;

    e.stopPropagation();
    e.preventDefault();
    console.log("ON CLICK CURSOR", tool);

    if (tool === "actors") {
      console.log("ADD ACTOR");
      addActor(sceneId, x, y);
      setTool("select");
    } else if (tool === "triggers") {
      console.log("ADD TRIGGER");
      addTrigger(sceneId, x, y);
      window.addEventListener("mouseup", this.onMouseUp);
    }
  };

  onMouseUp = e => {
    const { setTool } = this.props;
    setTool("select");
    window.removeEventListener("mouseup", this.onMouseUp);
  };

  render() {
    const { x, y, tool } = this.props;
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
            <PlusIcon />
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
  return {
    x,
    y,
    tool,
    prefab
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
