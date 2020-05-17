import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { ActorShape, PaletteShape } from "../../reducers/stateShape";
import * as actions from "../../actions";
import { getPalettesLookup, getSettings } from "../../reducers/entitiesReducer";
import { getCachedObject } from "../../lib/helpers/cache";
import { DMG_PALETTE } from "../../consts";

class Actor extends Component {
  onMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const { actor, sceneId, dragActorStart, setTool } = this.props;
    dragActorStart(sceneId, actor.id);
    setTool("select");
    window.addEventListener("mouseup", this.onMouseUp);
  };

  onMouseUp = (e) => {
    const { dragActorStop } = this.props;
    dragActorStop();
    window.removeEventListener("mouseup", this.onMouseUp);
  };

  render() {
    const { actor, selected, showSprite, palette } = this.props;
    const { x, y, spriteSheetId, direction, movementType, frame } = actor;
    return (
      <div
        className={cx("Actor", { "Actor--Selected": selected })}
        onMouseDown={this.onMouseDown}
        style={{
          top: y * 8,
          left: x * 8,
        }}
      >
        {showSprite && (
          <SpriteSheetCanvas
            spriteSheetId={spriteSheetId}
            direction={direction}
            frame={movementType === "static" ? frame : 0}
            palette={palette}
          />
        )}
      </div>
    );
  }
}

Actor.propTypes = {
  actor: ActorShape,
  sceneId: PropTypes.string.isRequired,
  palette: PaletteShape,
  selected: PropTypes.bool,
  showSprite: PropTypes.bool.isRequired,
  dragActorStart: PropTypes.func.isRequired,
  dragActorStop: PropTypes.func.isRequired,
  setTool: PropTypes.func.isRequired,
};

Actor.defaultProps = {
  actor: {},
  palette: undefined,
  selected: false,
};

function mapStateToProps(state, props) {
  const { type: editorType, entityId, scene: sceneId } = state.editor;
  const actor = state.entities.present.entities.actors[props.id];
  const selected =
    editorType === "actors" &&
    sceneId === props.sceneId &&
    entityId === props.id;
  const showSprite = state.editor.zoom > 80;
  const settings = getSettings(state);
  const palettesLookup = getPalettesLookup(state);
  const gbcEnabled = settings.customColorsEnabled;
  const palette = gbcEnabled
    ? getCachedObject(
        palettesLookup[actor.paletteId] ||
          palettesLookup[settings.defaultSpritePaletteId]
      )
    : DMG_PALETTE;

  return {
    actor,
    selected,
    showSprite,
    palette,
  };
}

const mapDispatchToProps = {
  dragActorStart: actions.dragActorStart,
  dragActorStop: actions.dragActorStop,
  setTool: actions.setTool,
};

export default connect(mapStateToProps, mapDispatchToProps)(Actor);
