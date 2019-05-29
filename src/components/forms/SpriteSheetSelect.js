import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import l10n from "../../lib/helpers/l10n";
import { SpriteShape } from "../../reducers/stateShape";

const type = t => s => s.type === t;

class SpriteSheetSelect extends Component {
  render() {
    const { spriteSheets, id, value, onChange, direction, frame } = this.props;
    const current = spriteSheets.find(s => s.id === value);
    return (
      <div className="SpriteSheetSelect">
        <select id={id} value={value} onChange={onChange}>
          {!current && <option value="" />}
          <optgroup label={l10n("FIELD_SPRITE_ANIMATED_ACTORS")}>
            {spriteSheets.filter(type("actor_animated")).map(spriteSheet => (
              <option key={spriteSheet.id} value={spriteSheet.id}>
                {spriteSheet.name}
              </option>
            ))}
          </optgroup>
          <optgroup label={l10n("FIELD_SPRITE_ACTORS")}>
            {spriteSheets.filter(type("actor")).map(spriteSheet => (
              <option key={spriteSheet.id} value={spriteSheet.id}>
                {spriteSheet.name}
              </option>
            ))}
          </optgroup>
          <optgroup label={l10n("FIELD_SPRITES")}>
            {spriteSheets
              .filter(s => s.type !== "actor_animated" && s.type !== "actor")
              .map(spriteSheet => (
                <option key={spriteSheet.id} value={spriteSheet.id}>
                  {spriteSheet.name}
                  {spriteSheet.numFrames > 1 &&
                    ` (${spriteSheet.numFrames} ${l10n(
                      "FIELD_SPRITE_FRAMES"
                    )})`}
                </option>
              ))}
          </optgroup>
        </select>
        <div className="SpriteSheetSelect__Preview">
          {value && (
            <SpriteSheetCanvas
              spriteSheetId={value}
              direction={direction}
              frame={frame}
            />
          )}
        </div>
      </div>
    );
  }
}

SpriteSheetSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  spriteSheets: PropTypes.arrayOf(SpriteShape).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number
};

SpriteSheetSelect.defaultProps = {
  id: undefined,
  value: "",
  frame: null,
  direction: null
};

function mapStateToProps(state) {
  return {
    spriteSheets:
      (state.project.present && state.project.present.spriteSheets) || []
  };
}

export default connect(mapStateToProps)(SpriteSheetSelect);
