import React, { Component } from "react";
import { connect } from "react-redux";

class ActorSelect extends Component {
  render() {
    const { actors, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        <option value="player">Player</option>
        {actors.map((actor, index) => (
          <option key={actor.id} value={actor.id}>
            {actor.name || "Actor " + (index + 1)}
          </option>
        ))}
      </select>
    );
  }
}

function mapStateToProps(state) {
  const scene = state.project.present.scenes.find(
    scene => scene.id === state.editor.scene
  );
  const actors = scene ? scene.actors : [];
  return {
    actors
  };
}

export default connect(mapStateToProps)(ActorSelect);
