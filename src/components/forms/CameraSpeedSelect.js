import React, { Component } from "react";
import PropTypes from "prop-types";
import l10n from "lib/helpers/l10n";

const speeds = [1, 2, 3, 4, 5];

class CameraSpeedSelect extends Component {
  render() {
    const { allowNone, ...rest } = this.props;
    return (
      <select {...rest}>
        {allowNone && <option value={0}>Instant</option>}
        {speeds.map((speed) => (
          <option key={speed} value={speed}>
            Speed {speed} {speed === 1 ? `(${l10n("FIELD_FASTER")})` : ""}
            {speed === 5 ? `(${l10n("FIELD_SLOWER")})` : ""}
          </option>
        ))}
      </select>
    );
  }
}

CameraSpeedSelect.propTypes = {
  allowNone: PropTypes.bool,
};

CameraSpeedSelect.defaultProps = {
  allowNone: false,
};

export default CameraSpeedSelect;
