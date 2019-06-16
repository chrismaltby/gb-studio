import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { TriggerShape } from "../../reducers/stateShape";
import * as actions from "../../actions";

class Trigger extends Component {
  onMouseDown = e => {
    // console.log("MOUSE DOWN TRIGGER");
    e.stopPropagation();
    e.preventDefault();
    const { id, sceneId, dragTriggerStart } = this.props;
    dragTriggerStart(sceneId, id);
    window.addEventListener("mouseup", this.onMouseUp);
  };

  onMouseUp = e => {
    console.log("UP");
    const { dragTriggerStop } = this.props;
    dragTriggerStop();
    window.removeEventListener("mouseup", this.onMouseUp);
  };

  render() {
    const { trigger, selected } = this.props;
    const { x, y, width, height } = trigger;
    // console.log("render: Trigger");
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
  trigger: TriggerShape,
  selected: PropTypes.bool
};

Trigger.defaultProps = {
  trigger: {},
  selected: false
};

function mapStateToProps(state, props) {
  const { type: editorType, entityId, scene: sceneId } = state.editor;
  const trigger = state.entities.present.entities.triggers[props.id];
  const selected =
    editorType === "triggers" &&
    sceneId === props.sceneId &&
    entityId === props.id;
  return {
    trigger,
    selected
  };
}

const mapDispatchToProps = {
  dragTriggerStart: actions.dragTriggerStart,
  dragTriggerStop: actions.dragTriggerStop
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Trigger);
