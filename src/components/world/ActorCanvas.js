import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { framesPerDirection } from "../../lib/helpers/gbstudio";

const ActorCanvas = ({
  spriteSheetId,
  movementType,
  direction,
  frame,
  totalFrames
}) => (
  <SpriteSheetCanvas
    spriteSheetId={spriteSheetId}
    direction={movementType === "static" && !direction ? "down" : direction}
    frame={
      !direction ? (frame !== null ? frame || 0 : frame || 0) % totalFrames : 0
    }
  />
);

ActorCanvas.propTypes = {
  spriteSheetId: PropTypes.string.isRequired,
  movementType: PropTypes.string.isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number,
  totalFrames: PropTypes.number
};

ActorCanvas.defaultProps = {
  direction: undefined,
  frame: undefined,
  totalFrames: 1
};

function mapStateToProps(state, props) {
  const { spriteSheetId, movementType, direction, frame } = props.actor;
  const spriteSheet =
    state.entities.present.entities.spriteSheets[spriteSheetId];
  const spriteFrames = spriteSheet ? spriteSheet.numFrames : 0;
  const totalFrames = framesPerDirection(movementType, spriteFrames);
  return {
    spriteSheetId,
    movementType,
    direction: props.direction || direction,
    frame: props.frame || frame,
    totalFrames
  };
}

export default connect(mapStateToProps)(ActorCanvas);
