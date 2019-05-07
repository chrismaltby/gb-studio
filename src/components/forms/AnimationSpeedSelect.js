import React, { Component } from "react";
import l10n from "../../lib/helpers/l10n";

const speeds = [0, 1, 2, 3, 4];

class AnimationSpeedSelect extends Component {
  render() {
    const { allowNone, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        {speeds.map((speed, index) => (
          <option key={speed} value={speed}>
            {l10n("FIELD_SPEED")} {speed}{" "}
            {speed === 0
              ? `(${l10n("FIELD_SLOWER")})`
              : speed === 4
              ? `(${l10n("FIELD_FASTER")})`
              : ""}
          </option>
        ))}
      </select>
    );
  }
}

AnimationSpeedSelect.defaultProps = {
    value: "3"
};

export default AnimationSpeedSelect;
