import React, { Component } from "react";
import { connect } from "react-redux";

class SpriteSheetSelect extends Component {
  render() {
    const { spriteSheets, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        <option>None</option>
        {spriteSheets.map(spriteSheet =>
          <option key={spriteSheet.id} value={spriteSheet.id}>
            {spriteSheet.name} ({spriteSheet.type})
          </option>
        )}
      </select>
    );
  }
}

function mapStateToProps(state) {
  return {
    spriteSheets: (state.world && state.world.spriteSheets) || []
  };
}

export default connect(mapStateToProps)(SpriteSheetSelect);
