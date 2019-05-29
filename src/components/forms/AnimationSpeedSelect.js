import React, { Component } from "react";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";

const speeds = [0, 1, 2, 3, 4];

class AnimationSpeedSelect extends Component {
  render() {
    const { id, value, onChange } = this.props;
    return (
      <select id={id} value={value} onChange={onChange}>
        {speeds.map((speed, index) => (
          <option key={speed} value={speed}>
            {l10n("FIELD_SPEED")} {speed}{" "}
            {speed === 0 && `(${l10n("FIELD_SLOWER")})`}
            {speed === 4 && `(${l10n("FIELD_FASTER")})`}
          </option>
        ))}
      </select>
    );
  }
}

AnimationSpeedSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

AnimationSpeedSelect.defaultProps = {
  id: undefined,
  value: "3"
};

export default AnimationSpeedSelect;
