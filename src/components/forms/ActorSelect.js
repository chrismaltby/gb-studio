import React, { Component } from "react";
import { connect } from "react-redux";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";

class ActorSelect extends Component {
  render() {
    const {
      actors,
      playerSpriteSheetId,
      spriteSheets,
      dispatch,
      ...rest
    } = this.props;
    const actor = actors.find(a => a.id === rest.value) || {
      spriteSheetId: playerSpriteSheetId,
      movementType: "player"
    };
    const spriteSheet =
      actor && spriteSheets.find(s => s.id === actor.spriteSheetId);
    const spriteFrames = spriteSheet ? spriteSheet.numFrames : 0;
    const totalFrames =
      actor && actor.movementType === "static"
        ? spriteFrames // If movement type is static and cycling frames, always set full frame count
        : spriteFrames === 6
        ? 2 // Actor Animated
        : spriteFrames === 3
        ? 1 // Actor
        : spriteFrames;

    return (
      <div className="SpriteSheetSelect">
        <select {...rest}>
          <option value="player">Player</option>
          {actors.map((actor, index) => (
            <option key={actor.id} value={actor.id}>
              {actor.name || `Actor ${  index + 1}`}
            </option>
          ))}
        </select>
        <div className="SpriteSheetSelect__Preview">
          {rest.value && actor && spriteSheet && (
            <SpriteSheetCanvas
              spriteSheetId={actor.spriteSheetId}
              direction={
                actor.movementType === "static" && !rest.direction
                  ? "down"
                  : rest.direction || actor.direction
              }
              frame={
                !rest.direction &&
                (rest.frame !== undefined
                  ? rest.frame || 0
                  : actor.frame || 0) % totalFrames
              }
            />
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const scene = state.project.present.scenes.find(
    scene => scene.id === state.editor.scene
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
