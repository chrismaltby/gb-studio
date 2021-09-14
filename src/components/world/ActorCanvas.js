import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { PaletteShape } from "store/stateShape";
import { getCachedObject } from "lib/helpers/cache";
import { DMG_PALETTE } from "../../consts";
import { paletteSelectors } from "store/features/entities/entitiesState";
import { getSettings } from "store/features/settings/settingsState";

const ActorCanvas = ({
  spriteSheetId,
  direction,
  overrideDirection,
  frame,
  palette,
}) => {
  let spriteFrame = frame || 0;
  if (overrideDirection) {
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
};

function mapStateToProps(state, props) {
  const { spriteSheetId, direction, frame, paletteId } = props.actor;

  const settings = getSettings(state);
  const palettesLookup = paletteSelectors.selectEntities(state);
  const gbcEnabled = settings.customColorsEnabled;
  const palette = gbcEnabled
    ? getCachedObject(
        palettesLookup[paletteId] ||
          palettesLookup[settings.defaultSpritePaletteId]
      )
    : DMG_PALETTE;

  return {
    spriteSheetId,
    direction: props.direction !== undefined ? props.direction : direction,
    overrideDirection: props.direction,
    frame: props.frame !== undefined ? props.frame : frame,
    palette,
  };
}

export default connect(mapStateToProps)(ActorCanvas);
