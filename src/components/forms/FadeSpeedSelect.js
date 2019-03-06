import React, { Component } from "react";
import { connect } from "react-redux";

const speeds = [1, 2, 3, 4, 5, 6];

class FadeSpeedSelect extends Component {
  render() {
    const { allowNone, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        {allowNone && <option value={0}>Instant</option>}
        {speeds.map((speed, index) => (
          <option key={speed} value={speed}>
            Speed {speed}{" "}
            {speed === 1 ? "(Faster)" : speed === 6 ? "(Slower)" : ""}
          </option>
        ))}
      </select>
    );
  }
}

export default FadeSpeedSelect;
