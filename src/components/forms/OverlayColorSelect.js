import React, { Component } from "react";
import { connect } from "react-redux";

const colors = ["black", "white"];

class OverlayColorSelect extends Component {
  render() {
    const { dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        {colors.map((color, index) => (
          <option key={index} value={color}>
            {color[0].toUpperCase() + color.substring(1)}
          </option>
        ))}
      </select>
    );
  }
}

export default OverlayColorSelect;
