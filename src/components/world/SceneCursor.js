import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { PlusIcon } from "../library/Icons";

class SceneCursor extends Component {
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

export default connect(mapStateToProps)(SceneCursor);
