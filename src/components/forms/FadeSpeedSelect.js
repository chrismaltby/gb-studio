import React, { Component } from "react";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";

const speeds = [1, 2, 3, 4, 5, 6];

class FadeSpeedSelect extends Component {
  render() {
    const { allowNone, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        {allowNone && <option value={0}>Instant</option>}
        {speeds.map(speed => (
          <option key={speed} value={speed}>
            {l10n("FIELD_SPEED")} {speed}{" "}
            {speed === 1 ? `(${l10n("FIELD_FASTER")})` : ""}
            {speed === 6 ? `(${l10n("FIELD_SLOWER")})` : ""}
          </option>
        ))}
      </select>
    );
  }
}

FadeSpeedSelect.propTypes = {
  allowNone: PropTypes.bool,
  dispatch: PropTypes.func
};

FadeSpeedSelect.defaultProps = {
  allowNone: false,
  dispatch: undefined
};

export default FadeSpeedSelect;
