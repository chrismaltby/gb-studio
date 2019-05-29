import React, { Component } from "react";
import PropTypes from "prop-types";

const colors = ["black", "white"];

class OverlayColorSelect extends Component {
  render() {
    const { id, value, onChange } = this.props;
    return (
      <select id={id} value={value} onChange={onChange}>
        {colors.map(color => (
          <option key={color} value={color}>
            {color[0].toUpperCase() + color.substring(1)}
          </option>
        ))}
      </select>
    );
  }
}

OverlayColorSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

OverlayColorSelect.defaultProps = {
  id: undefined,
  value: ""
};

export default OverlayColorSelect;
