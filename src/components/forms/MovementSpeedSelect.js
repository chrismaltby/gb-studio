import React, { Component } from "react";
import l10n from "../../lib/helpers/l10n";

const speeds = [1, 2, 3, 4];

class MovementSpeedSelect extends Component {
  render() {
    const { allowNone, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        <option value={0}>{l10n("FIELD_SPEED")} ½ ({l10n("FIELD_SLOWER")})</option>
        {speeds.map((speed, index) => (
          <option key={speed} value={speed}>
            {l10n("FIELD_SPEED")} {speed}{" "}
            {speed === 4
              ? `(${l10n("FIELD_FASTER")})`
              : ""}
          </option>
        ))}
      </select>
    );
  }
}

export default MovementSpeedSelect;
