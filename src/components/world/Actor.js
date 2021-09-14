import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import SpriteSheetCanvas from "./SpriteSheetCanvas";
import { ActorShape, PaletteShape } from "store/stateShape";
import { getCachedObject } from "lib/helpers/cache";
import { DMG_PALETTE, MIDDLE_MOUSE } from "../../consts";
import {
  actorSelectors,
  paletteSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { getSettings } from "store/features/settings/settingsState";

class Actor extends Component {
  onMouseDown = (e) => {
    const { actor, sceneId, dragActorStart, setTool, editable } = this.props;
    if (editable && e.nativeEvent.which !== MIDDLE_MOUSE) {
      dragActorStart({ sceneId, actorId: actor.id });
      setTool({ tool: "select" });
      window.addEventListener("mouseup", this.onMouseUp);
    }
  };

  onMouseUp = (_e) => {
    const { dragActorStop } = this.props;
    dragActorStop();
    window.removeEventListener("mouseup", this.onMouseUp);
  };

  render() {
    const { actor, selected, showSprite, palette, palettes } = this.props;
    const { x, y, spriteSheetId, direction } = actor;
    return (
      <>
        {selected && actor.isPinned && <div className="Actor__ScreenPreview" />}
        <div
          className={cx("Actor", { "Actor--Selected": selected })}
          onMouseDown={this.onMouseDown}
          style={{
            top: y * 8,
            left: x * 8,
          }}
        >
          {showSprite && (
            <div style={{ pointerEvents: "none" }}>
              <SpriteSheetCanvas
                spriteSheetId={spriteSheetId}
                direction={direction}
                frame={0}
                palette={palette}
                palettes={palettes}
                offsetPosition
              />
            </div>
          )}
        </div>
      </>
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
  editable: PropTypes.bool.isRequired,
};

Actor.defaultProps = {
  actor: {},
  palette: undefined,
  selected: false,
};

function mapStateToProps(state, props) {
  const { type: editorType, entityId, scene: sceneId } = state.editor;

  const actor = actorSelectors.selectById(state, props.id);

  const selected =
    editorType === "actor" &&
    sceneId === props.sceneId &&
    entityId === props.id;
  const showSprite = state.editor.zoom > 80;
  const settings = getSettings(state);
  const palettesLookup = paletteSelectors.selectEntities(state);
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
  dragActorStart: editorActions.dragActorStart,
  dragActorStop: editorActions.dragActorStop,
  setTool: editorActions.setTool,
};

export default connect(mapStateToProps, mapDispatchToProps)(Actor);
