import React, { Component } from "react";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";

class SpriteTypeSelect extends Component {
  render() {
    const { id, value, onChange } = this.props;
    return (
      <select id={id} value={value} onChange={onChange}>
        <option value="static">{l10n("FIELD_MOVEMENT_STATIC")}</option>
        <option value="actor">
          {l10n("ACTOR")}
        </option>
      </select>
    );
  }
}

SpriteTypeSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

SpriteTypeSelect.defaultProps = {
  id: undefined,
  value: "static"
};

export default SpriteTypeSelect;
