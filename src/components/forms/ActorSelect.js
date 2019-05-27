import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import { framesPerDirection } from "../../lib/helpers/gbstudio";
import { ActorShape, SpriteShape } from "../../reducers/stateShape";

class ActorSelect extends Component {
  render() {
    const {
      actors,
      playerSpriteSheetId,
      spriteSheets,
      id,
      value,
      direction,
      frame,
      onChange
    } = this.props;

    const actor = actors.find(a => a.id === value) || {
      spriteSheetId: playerSpriteSheetId,
      movementType: "player"
    };
    const spriteSheet =
      actor && spriteSheets.find(s => s.id === actor.spriteSheetId);
    const spriteFrames = spriteSheet ? spriteSheet.numFrames : 0;
    const totalFrames = framesPerDirection(actor.movementType, spriteFrames);

    return (
      <div className="SpriteSheetSelect">
        <select id={id} value={value} onChange={onChange}>
          <option value="player">Player</option>
          {actors.map((a, index) => (
            <option key={a.id} value={a.id}>
              {a.name || `Actor ${index + 1}`}
            </option>
          ))}
        </select>
        <div className="SpriteSheetSelect__Preview">
          {value && actor && spriteSheet && (
            <SpriteSheetCanvas
              spriteSheetId={actor.spriteSheetId}
              direction={
                actor.movementType === "static" && !direction
                  ? "down"
                  : direction || actor.direction
              }
              frame={
                !direction
                  ? (frame !== null ? frame || 0 : actor.frame || 0) %
                    totalFrames
                  : 0
              }
            />
          )}
        </div>
      </div>
    );
  }
}

ActorSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  playerSpriteSheetId: PropTypes.string,
  actors: PropTypes.arrayOf(ActorShape).isRequired,
  spriteSheets: PropTypes.arrayOf(SpriteShape).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number
};

ActorSelect.defaultProps = {
  id: "",
  value: "",
  playerSpriteSheetId: "",
  frame: null,
  direction: null
};

function mapStateToProps(state) {
  const scene = state.project.present.scenes.find(
    s => s.id === state.editor.scene
  );
  const actors = scene ? scene.actors : [];
  const spriteSheets = state.project.present.spriteSheets;
  const settings = state.project.present.settings;
  return {
    actors,
    spriteSheets,
    playerSpriteSheetId: settings.playerSpriteSheetId
  };
}

export default connect(mapStateToProps)(ActorSelect);
