import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { framesPerDirection } from "../../lib/helpers/gbstudio";
import { getPalettesLookup, getSettings } from "../../reducers/entitiesReducer";
import { PaletteShape } from "../../reducers/stateShape";
import { getCachedObject } from "../../lib/helpers/cache";
import { DMG_PALETTE, SPRITE_TYPE_STATIC } from "../../consts";

const ActorCanvas = ({
  spriteSheetId,
  spriteType,
  direction,
  overrideDirection,
  frame,
  totalFrames,
  palette,
}) => {
  let spriteFrame = frame || 0;
  if (spriteType !== SPRITE_TYPE_STATIC) {
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
  spriteType: PropTypes.string,
  direction: PropTypes.string,
  overrideDirection: PropTypes.string,
  frame: PropTypes.number,
  totalFrames: PropTypes.number,
  palette: PaletteShape,
};

ActorCanvas.defaultProps = {
  direction: undefined,
  overrideDirection: undefined,
  frame: undefined,
  totalFrames: 1,
  palette: undefined,
  spriteType: SPRITE_TYPE_STATIC
};

function mapStateToProps(state, props) {
  const {
    spriteSheetId,
    spriteType,
    direction,
    frame,
    paletteId,
  } = props.actor;

  const spriteSheet =
    state.entities.present.entities.spriteSheets[spriteSheetId];
  const spriteFrames = spriteSheet ? spriteSheet.numFrames : 0;
  const totalFrames = framesPerDirection(spriteType, spriteFrames);
  const settings = getSettings(state);
  const palettesLookup = getPalettesLookup(state);
  const gbcEnabled = settings.customColorsEnabled;
  const palette = gbcEnabled
    ? getCachedObject(
        palettesLookup[paletteId] ||
          palettesLookup[settings.defaultSpritePaletteId]
      )
    : DMG_PALETTE;

  return {
    spriteSheetId,
    spriteType,
    direction: props.direction !== undefined ? props.direction : direction,
    overrideDirection: props.direction,
    frame: props.frame !== undefined ? props.frame % totalFrames : frame,
    totalFrames,
    palette,
  };
}

export default connect(mapStateToProps)(ActorCanvas);
