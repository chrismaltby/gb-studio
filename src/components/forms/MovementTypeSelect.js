import React, { Component } from "react";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";

class MovementTypeSelect extends Component {
  render() {
    const { id, value, onChange } = this.props;
    return (
      <select id={id} value={value} onChange={onChange}>
        <option value="static">{l10n("FIELD_MOVEMENT_STATIC")}</option>
        <option value="faceInteraction">
          {l10n("FIELD_MOVEMENT_FACE_INTERACTION")}
        </option>
        <option value="randomFace">
          {l10n("FIELD_MOVEMENT_RANDOM_ROTATION")}
        </option>
        <option value="randomWalk">{l10n("FIELD_MOVEMENT_RANDOM_WALK")}</option>
      </select>
    );
  }
}

MovementTypeSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

MovementTypeSelect.defaultProps = {
  id: undefined,
  value: "static"
};

export default MovementTypeSelect;
