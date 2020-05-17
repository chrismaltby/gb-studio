import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { framesPerDirection } from "../../lib/helpers/gbstudio";
import { getPalettesLookup, getSettings } from "../../reducers/entitiesReducer";
import { PaletteShape } from "../../reducers/stateShape";

const ActorCanvas = ({
  spriteSheetId,
  movementType,
  direction,
  overrideDirection,
  frame,
  totalFrames,
  palette
}) => {
  let spriteFrame = frame || 0;
  if (movementType !== "static") {
    spriteFrame = frame % totalFrames;
  } else if (overrideDirection) {
    spriteFrame = 0;
  }

  return (
    <SpriteSheetCanvas
      spriteSheetId={spriteSheetId}
      direction={direction}
      frame={spriteFrame}
      palette={palette}
    />
  );
};

ActorCanvas.propTypes = {
  spriteSheetId: PropTypes.string.isRequired,
  movementType: PropTypes.string.isRequired,
  direction: PropTypes.string,
  overrideDirection: PropTypes.string,
  frame: PropTypes.number,
  totalFrames: PropTypes.number,
  palette: PaletteShape
};

ActorCanvas.defaultProps = {
  direction: undefined,
  overrideDirection: undefined,
  frame: undefined,
  totalFrames: 1,
  palette: undefined
};

function mapStateToProps(state, props) {
  const { spriteSheetId, movementType, direction, frame, paletteId } = props.actor;
  const spriteSheet =
    state.entities.present.entities.spriteSheets[spriteSheetId];
  const spriteFrames = spriteSheet ? spriteSheet.numFrames : 0;
  const totalFrames = framesPerDirection(movementType, spriteFrames);
  const settings = getSettings(state);
  const palettesLookup = getPalettesLookup(state);
  const palette = palettesLookup[paletteId] || palettesLookup[settings.defaultSpritePaletteId];
  return {
    spriteSheetId,
    movementType,
    direction: props.direction !== undefined ? props.direction : direction,
    overrideDirection: props.direction,
    frame: props.frame !== undefined ? props.frame % totalFrames : frame,
    totalFrames,
    palette
  };
}

export default connect(mapStateToProps)(ActorCanvas);
