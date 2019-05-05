import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import MovementTypeSelect from "../forms/MovementTypeSelect";
import SpriteSheetSelect from "../forms/SpriteSheetSelect";
import ScriptEditor from "../script/ScriptEditor";
import DirectionPicker from "../forms/DirectionPicker";
import { FormField } from "../library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import { DropdownButton } from "../library/Button";
import SidebarHeading from "./SidebarHeading";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";

class ActorEditor extends Component {
  onEdit = key => e => {
    this.props.editActor(this.props.scene, this.props.id, {
      [key]: castEventValue(e)
    });
  };

  onCopy = e => {
    this.props.copyActor(this.props.actor);
  };

  onPaste = e => {
    const { clipboardActor } = this.props;
    this.props.pasteActor(this.props.scene, clipboardActor);
  };

  onRemove = e => {
    this.props.removeActor(this.props.scene, this.props.id);
  };

  render() {
    const {
      index,
      actor,
      id,
      spriteSheet,
      sceneImage,
      clipboardActor,
      collisions
    } = this.props;

    if (!actor) {
      return <div />;
    }

    return (
      <div className="ActorEditor">
        <SidebarHeading
          title={l10n("ACTOR")}
          buttons={
            <DropdownButton small transparent right>
              <MenuItem onClick={this.onCopy}>
                {l10n("MENU_COPY_ACTOR")}
              </MenuItem>
              {clipboardActor && (
                <MenuItem onClick={this.onPaste}>
                  {l10n("MENU_PASTE_ACTOR")}
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem onClick={this.onRemove}>
                {l10n("MENU_DELETE_ACTOR")}
              </MenuItem>
            </DropdownButton>
          }
        />

        <div>
          <FormField>
            <label htmlFor="actorName">{l10n("FIELD_NAME")}</label>
            <input
              id="actorName"
              placeholder={"Actor " + (index + 1)}
              value={actor.name || ""}
              onChange={this.onEdit("name")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="actorX">{l10n("FIELD_X")}</label>
            <input
              id="actorX"
              type="number"
              value={actor.x}
              placeholder={0}
              min={0}
              max={sceneImage.width - 2}
              onChange={this.onEdit("x")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="actorY">{l10n("FIELD_Y")}</label>
            <input
              id="actorY"
              type="number"
              value={actor.y}
              placeholder={0}
              min={0}
              max={sceneImage.height - 1}
              onChange={this.onEdit("y")}
            />
          </FormField>

          <FormField>
            <label htmlFor="actorSprite">{l10n("FIELD_SPRITE_SHEET")}</label>
            <SpriteSheetSelect
              id="actorSprite"
              value={actor.spriteSheetId}
              direction={actor.direction}
              onChange={this.onEdit("spriteSheetId")}
            />
          </FormField>

          {spriteSheet && spriteSheet.type !== "static" && (
            <div>
              <FormField halfWidth>
                <label htmlFor="actorMovement">
                  {l10n("FIELD_MOVEMENT_TYPE")}
                </label>
                <MovementTypeSelect
                  id="actorMovement"
                  value={actor.movementType}
                  onChange={this.onEdit("movementType")}
                />
              </FormField>
              <FormField halfWidth>
                <label htmlFor="actorDirection">
                  {l10n("FIELD_DIRECTION")}
                </label>
                <DirectionPicker
                  id="actorDirection"
                  value={actor.direction}
                  onChange={this.onEdit("direction")}
                />
              </FormField>
            </div>
          )}

          <FormField>
            <label>
              <input
                type="checkbox"
                className="Checkbox"
                checked={actor.collisionsDisabled || false}
                onChange={this.onEdit("collisionsDisabled")}
              />
              <div className="FormCheckbox" />
              {l10n("FIELD_COLLISIONS")}
            </label>
          </FormField>
        </div>

        <ScriptEditor
          value={actor.script}
          type="actor"
          title={l10n("SIDEBAR_ACTOR_SCRIPT")}
          onChange={this.onEdit("script")}
        />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const { project } = state;
  const scene =
    project.present.scenes &&
    project.present.scenes.find(scene => scene.id === props.scene);
  const sceneImage =
    scene &&
    project.present.backgrounds.find(
      background => background.id === scene.backgroundId
    );
  const actor = scene && scene.actors.find(a => a.id === props.id);
  const index = scene && scene.actors.indexOf(actor);
  const spriteSheet =
    actor &&
    project.present.spriteSheets.find(
      spriteSheet => spriteSheet.id === actor.spriteSheetId
    );
  return {
    index,
    actor,
    spriteSheet,
    sceneImage,
    clipboardActor: state.clipboard.actor
  };
}

const mapDispatchToProps = {
  editActor: actions.editActor,
  removeActor: actions.removeActor,
  copyActor: actions.copyActor,
  pasteActor: actions.pasteActor
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActorEditor);
