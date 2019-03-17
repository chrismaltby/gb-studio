import React, { Component } from "react";

class MovementTypeSelect extends Component {
  render() {
    return (
      <select {...this.props}>
        <option value="static">Static</option>
        <option value="faceInteraction">Face Interaction</option>
        <option value="rotateTRB">Rotate Top/Right/Bottom</option>
        <option value="randomFace">Random Rotation</option>
        <option value="randomWalk">Random Walk</option>
      </select>
    );
  }
}

export default MovementTypeSelect;
