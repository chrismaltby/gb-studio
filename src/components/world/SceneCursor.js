import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";

class SceneCursor extends Component {
  render() {
    const { x, y } = this.props;
    return (
      <div
        className={cx("SceneCursor")}
        onMouseDown={this.onMouseDown}
        style={{
          top: y * 8,
          left: x * 8
        }}
      />
    );
  }
}

SceneCursor.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired
};

function mapStateToProps(state, props) {
  const { x, y } = state.editor.hover;
  return {
    x,
    y
  };
}

export default connect(mapStateToProps)(SceneCursor);
