import React, { Component } from "react";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";

const speeds = [1, 2, 3, 4];

class MovementSpeedSelect extends Component {
  render() {
    const { id, value, onChange } = this.props;
    return (
      <select id={id} value={value} onChange={onChange}>
        <option value={0}>
          {l10n("FIELD_SPEED")} ½ ({l10n("FIELD_SLOWER")})
        </option>
        {speeds.map((speed, index) => (
          <option key={speed} value={speed}>
            {l10n("FIELD_SPEED")} {speed}{" "}
            {speed === 4 ? `(${l10n("FIELD_FASTER")})` : ""}
          </option>
        ))}
      </select>
    );
  }
}

MovementSpeedSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

MovementSpeedSelect.defaultProps = {
  id: undefined,
  value: "1"
};

export default MovementSpeedSelect;
