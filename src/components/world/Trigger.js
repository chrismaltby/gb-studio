import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import editorActions from "../../store/features/editor/editorActions";
import { triggerSelectors } from "../../store/features/entities/entitiesState";

class Trigger extends Component {
  onMouseDown = e => {
    const { id, sceneId, dragTriggerStart, setTool } = this.props;
    dragTriggerStart({sceneId, triggerId:id});
    setTool({tool:"select"});
    window.addEventListener("mouseup", this.onMouseUp);
  };

  onMouseUp = e => {
    const { dragTriggerStop } = this.props;
    dragTriggerStop();
    window.removeEventListener("mouseup", this.onMouseUp);
  };

  render() {
    const { x, y, width, height, selected } = this.props;
    return (
      <div
        className={cx("Trigger", { "Trigger--Selected": selected })}
        onMouseDown={this.onMouseDown}
        style={{
          top: y * 8,
          left: x * 8,
          width: Math.max(width, 1) * 8,
          height: Math.max(height, 1) * 8
        }}
      />
    );
  }
}

Trigger.propTypes = {
  id: PropTypes.string.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  selected: PropTypes.bool,
  sceneId: PropTypes.string.isRequired,
  setTool: PropTypes.func.isRequired,
  dragTriggerStart: PropTypes.func.isRequired,
  dragTriggerStop: PropTypes.func.isRequired
};

Trigger.defaultProps = {
  selected: false
};

function mapStateToProps(state, props) {
  const { type: editorType, entityId, scene: sceneId } = state.editor;

  const trigger = triggerSelectors.selectById(state, props.id);

  const { x, y, width, height } = trigger;
  const selected =
    editorType === "trigger" &&
    sceneId === props.sceneId &&
    entityId === props.id;
  return {
    x: x || 0,
    y: y || 0,
    width: width || 1,
    height: height || 1,
    selected
  };
}

const mapDispatchToProps = {
  dragTriggerStart: editorActions.dragTriggerStart,
  dragTriggerStop: editorActions.dragTriggerStop,
  setTool: editorActions.setTool
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Trigger);
