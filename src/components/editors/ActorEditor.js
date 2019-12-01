/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import * as actions from "../../actions";
import MovementTypeSelect from "../forms/MovementTypeSelect";
import SpriteSheetSelect from "../forms/SpriteSheetSelect";
import ScriptEditor from "../script/ScriptEditor";
import DirectionPicker from "../forms/DirectionPicker";
import { FormField, ToggleableFormField } from "../library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import MovementSpeedSelect from "../forms/MovementSpeedSelect";
import AnimationSpeedSelect from "../forms/AnimationSpeedSelect";
import Sidebar, { SidebarHeading, SidebarColumn, SidebarTabs } from "./Sidebar";
import { SceneIcon } from "../library/Icons";
import { ActorShape, SceneShape, SpriteShape } from "../../reducers/stateShape";
import WorldEditor from "./WorldEditor";

class ActorEditor extends Component {
  constructor() {
    super();
    this.state = {
      clipboardActor: null,
      scriptMode: "interact"
    };
  }

  onSetScriptMode = mode => {
    this.setState({
      scriptMode: mode
    });
  };

  onEdit = key => e => {
    const { editActor, sceneId, actor } = this.props;
    editActor(sceneId, actor.id, {
      [key]: castEventValue(e)
    });
  };

  onEditScript = this.onEdit("script");

  onEditStartScript = this.onEdit("startScript");

  onCopy = e => {
    const { copyActor, actor } = this.props;
    copyActor(actor);
  };

  onPaste = e => {
    const { setActorPrefab } = this.props;
    const { clipboardActor } = this.state;
    setActorPrefab(clipboardActor);
  };

  onRemove = e => {
    const { removeActor, sceneId, actor } = this.props;
    removeActor(sceneId, actor.id);
  };

  readClipboard = e => {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__type === "actor") {
        this.setState({ clipboardActor: clipboardData });
      } else {
        this.setState({ clipboardActor: null });
      }
    } catch (err) {
      this.setState({ clipboardActor: null });
    }
  };

  render() {
    const { index, actor, scene, spriteSheet, selectSidebar } = this.props;
    const { clipboardActor, scriptMode } = this.state;

    if (!actor) {
      return <WorldEditor />;
    }

    const showDirectionInput =
      spriteSheet &&
      spriteSheet.type !== "static" &&
      spriteSheet.type !== "animated" &&
      actor.movementType !== "static";

    const showFrameInput =
      spriteSheet &&
      spriteSheet.numFrames > 1 &&
      actor.movementType === "static";

    const showAnimatedCheckbox =
      spriteSheet &&
      spriteSheet.numFrames > 1 &&
      (actor.movementType === "static" || spriteSheet.type !== "actor");

    const showAnimSpeed =
      spriteSheet &&
      ((spriteSheet.type === "actor_animated" &&
        actor.movementType !== "static") ||
        (actor.animate &&
          (actor.movementType === "static" || spriteSheet.type !== "actor")));

    const renderScriptHeader = ({ buttons }) => (
      <SidebarTabs
        value={scriptMode}
        values={{
          interact: l10n("SIDEBAR_ON_INTERACT"),
          start: l10n("SIDEBAR_ON_INIT")
        }}
        buttons={buttons}
        onChange={this.onSetScriptMode}
      />
    );

    return (
      <Sidebar onMouseDown={selectSidebar}>
        <SidebarColumn>
          <SidebarHeading
            title={l10n("ACTOR")}
            buttons={
              <DropdownButton
                small
                transparent
                right
                onMouseDown={this.readClipboard}
              >
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
              <label htmlFor="actorName">
                {l10n("FIELD_NAME")}
                <input
                  id="actorName"
                  placeholder={`Actor ${index + 1}`}
                  value={actor.name || ""}
                  onChange={this.onEdit("name")}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <label htmlFor="actorX">
                {l10n("FIELD_X")}
                <input
                  id="actorX"
                  type="number"
                  value={actor.x || ""}
                  placeholder={0}
                  min={0}
                  max={scene.width - 2}
                  onChange={this.onEdit("x")}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <label htmlFor="actorY">
                {l10n("FIELD_Y")}
                <input
                  id="actorY"
                  type="number"
                  value={actor.y || ""}
                  placeholder={0}
                  min={0}
                  max={scene.height - 1}
                  onChange={this.onEdit("y")}
                />
              </label>
            </FormField>

            <FormField>
              <label htmlFor="actorSprite">
                {l10n("FIELD_SPRITE_SHEET")}
                <SpriteSheetSelect
                  id="actorSprite"
                  value={actor.spriteSheetId}
                  direction={actor.direction}
                  frame={
                    spriteSheet &&
                    spriteSheet.numFrames > 1 &&
                    actor.movementType === "static"
                      ? actor.frame
                      : 0
                  }
                  onChange={this.onEdit("spriteSheetId")}
                />
              </label>
            </FormField>

            {spriteSheet &&
              spriteSheet.type !== "static" &&
              spriteSheet.type !== "animated" && (
                <FormField halfWidth>
                  <label htmlFor="actorMovement">
                    {l10n("FIELD_MOVEMENT_TYPE")}
                    <MovementTypeSelect
                      id="actorMovement"
                      value={actor.movementType}
                      onChange={this.onEdit("movementType")}
                    />
                  </label>
                </FormField>
              )}

            {showDirectionInput && (
              <FormField halfWidth>
                <label htmlFor="actorDirection">
                  {l10n("FIELD_DIRECTION")}
                  <DirectionPicker
                    id="actorDirection"
                    value={actor.direction}
                    onChange={this.onEdit("direction")}
                  />
                </label>
              </FormField>
            )}

            {showFrameInput && (
              <FormField halfWidth>
                <label htmlFor="actorFrame">
                  {l10n("FIELD_INITIAL_FRAME")}
                  <input
                    id="actorFrame"
                    type="number"
                    min={0}
                    max={spriteSheet.numFrames - 1}
                    placeholder={0}
                    value={actor.frame || ""}
                    onChange={this.onEdit("frame")}
                  />
                </label>
              </FormField>
            )}

            {showAnimatedCheckbox && (
              <FormField>
                <label htmlFor="actorAnimate">
                  <input
                    id="actorAnimate"
                    type="checkbox"
                    className="Checkbox"
                    checked={actor.animate || false}
                    onChange={this.onEdit("animate")}
                  />
                  <div className="FormCheckbox" />
                  {actor.movementType !== "static" &&
                  spriteSheet.type === "actor_animated"
                    ? l10n("FIELD_ANIMATE_WHEN_STATIONARY")
                    : l10n("FIELD_ANIMATE_FRAMES")}
                </label>
              </FormField>
            )}

            <FormField halfWidth>
              <label htmlFor="actorMoveSpeed">
                {l10n("FIELD_MOVEMENT_SPEED")}

                <MovementSpeedSelect
                  id="actorMoveSpeed"
                  value={actor.moveSpeed}
                  onChange={this.onEdit("moveSpeed")}
                />
              </label>
            </FormField>

            {showAnimSpeed && (
              <FormField halfWidth>
                <label htmlFor="actorAnimSpeed">
                  {l10n("FIELD_ANIMATION_SPEED")}

                  <AnimationSpeedSelect
                    id="actorAnimSpeed"
                    value={actor.animSpeed}
                    onChange={this.onEdit("animSpeed")}
                  />
                </label>
              </FormField>
            )}

            <ToggleableFormField
              htmlFor="actorNotes"
              closedLabel={l10n("FIELD_ADD_NOTES")}
              label={l10n("FIELD_NOTES")}
              open={!!actor.notes}
            >
              <textarea
                id="actorNotes"
                value={actor.notes || ""}
                placeholder={l10n("FIELD_NOTES")}
                onChange={this.onEdit("notes")}
                rows={3}
              />
            </ToggleableFormField>
          </div>

          <SidebarHeading title={l10n("SIDEBAR_NAVIGATION")} />
          <ul>
            <li
              onClick={() => {
                const { selectScene } = this.props;
                selectScene(scene.id);
              }}
            >
              <div className="EditorSidebar__Icon">
                <SceneIcon />
              </div>
              {scene.name || `Scene ${index + 1}`}
            </li>
          </ul>
        </SidebarColumn>

        <SidebarColumn>
          {scriptMode === "start" ? (
            <ScriptEditor
              value={actor.startScript}
              type="actor"
              renderHeader={renderScriptHeader}
              onChange={this.onEditStartScript}
              entityId={actor.id}
            />
          ) : (
            <ScriptEditor
              value={actor.script}
              type="actor"
              renderHeader={renderScriptHeader}
              onChange={this.onEditScript}
              entityId={actor.id}
            />
          )}
        </SidebarColumn>
      </Sidebar>
    );
  }
}

ActorEditor.propTypes = {
  index: PropTypes.number.isRequired,
  actor: ActorShape,
  scene: SceneShape,
  sceneId: PropTypes.string.isRequired,
  spriteSheet: SpriteShape,
  editActor: PropTypes.func.isRequired,
  removeActor: PropTypes.func.isRequired,
  copyActor: PropTypes.func.isRequired,
  setActorPrefab: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired
};

ActorEditor.defaultProps = {
  actor: null,
  scene: null,
  spriteSheet: null
};

function mapStateToProps(state, props) {
  const actor = state.entities.present.entities.actors[props.id];
  const scene = state.entities.present.entities.scenes[props.sceneId];
  const spriteSheet =
    actor && state.entities.present.entities.spriteSheets[actor.spriteSheetId];
  const index = scene.actors.indexOf(props.id);
  return {
    index,
    actor,
    scene,
    spriteSheet
  };
}

const mapDispatchToProps = {
  editActor: actions.editActor,
  removeActor: actions.removeActor,
  copyActor: actions.copyActor,
  setActorPrefab: actions.setActorPrefab,
  selectScene: actions.selectScene,
  selectSidebar: actions.selectSidebar
};

export default connect(mapStateToProps, mapDispatchToProps)(ActorEditor);
