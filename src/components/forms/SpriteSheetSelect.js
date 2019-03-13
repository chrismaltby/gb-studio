import React, { Component } from "react";
import { connect } from "react-redux";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";

class SpriteSheetSelect extends Component {
  render() {
    const { spriteSheets, dispatch, direction, ...rest } = this.props;
    return (
      <div className="SpriteSheetSelect">
        <select {...rest}>
          {spriteSheets.map(spriteSheet => (
            <option key={spriteSheet.id} value={spriteSheet.id}>
              {spriteSheet.name} ({spriteSheet.type})
            </option>
          ))}
        </select>
        <div className="SpriteSheetSelect__Preview">
          {rest.value && (
            <SpriteSheetCanvas
              spriteSheetId={rest.value}
              direction={direction}
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
