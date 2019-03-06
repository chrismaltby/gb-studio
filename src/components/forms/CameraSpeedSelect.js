import React, { Component } from "react";
import { connect } from "react-redux";

const speeds = [1, 2, 3, 4, 5];

class CameraSpeedSelect extends Component {
  render() {
    const { allowNone, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        {allowNone && <option value={0}>Instant</option>}
        {speeds.map((speed, index) => (
          <option key={speed} value={speed}>
            Speed {speed}{" "}
            {speed === 1 ? "(Faster)" : speed === 5 ? "(Slower)" : ""}
          </option>
        ))}
      </select>
    );
  }
}

export default CameraSpeedSelect;
