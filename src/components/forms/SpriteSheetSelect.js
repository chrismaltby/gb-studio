import React, { Component } from "react";
import { connect } from "react-redux";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import l10n from "../../lib/helpers/l10n";

const type = t => s => s.type === t;

class SpriteSheetSelect extends Component {
  render() {
    const { spriteSheets, dispatch, direction, frame, ...rest } = this.props;
    return (
      <div className="SpriteSheetSelect">
        <select {...rest}>
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
          {rest.value && (
            <SpriteSheetCanvas
              spriteSheetId={rest.value}
              direction={direction}
              frame={frame}
            />
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    spriteSheets:
      (state.project.present && state.project.present.spriteSheets) || []
  };
}

export default connect(mapStateToProps)(SpriteSheetSelect);
