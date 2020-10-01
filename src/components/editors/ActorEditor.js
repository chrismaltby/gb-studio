/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import SpriteTypeSelect from "../forms/SpriteTypeSelect";
import SpriteSheetSelect from "../forms/SpriteSheetSelect";
import ScriptEditor from "../script/ScriptEditor";
import DirectionPicker from "../forms/DirectionPicker";
import { FormField, ToggleableFormField } from "../library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import Button, { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import MovementSpeedSelect from "../forms/MovementSpeedSelect";
import AnimationSpeedSelect from "../forms/AnimationSpeedSelect";
import CollisionMaskPicker from "../forms/CollisionMaskPicker";
import Sidebar, { SidebarHeading, SidebarColumn, SidebarTabs } from "./Sidebar";
import { SceneIcon } from "../library/Icons";
import { ActorShape, SceneShape, SpriteShape } from "../../store/stateShape";
import WorldEditor from "./WorldEditor";
import PaletteSelect, { DMG_PALETTE } from "../forms/PaletteSelect";
import { getSettings } from "../../store/features/settings/settingsState";
import {
  SPRITE_TYPE_STATIC,
  SPRITE_TYPE_ACTOR,
  SPRITE_TYPE_ACTOR_ANIMATED,
  SPRITE_TYPE_ANIMATED,
} from "../../consts";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import { actorSelectors, sceneSelectors, spriteSheetSelectors } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import entitiesActions from "../../store/features/entities/entitiesActions";
import generateRandomWalkScript from "../../lib/movement/generateRandomWalkScript";
import generateRandomLookScript from "../../lib/movement/generateRandomLookScript";

const defaultTabs = {
  interact: l10n("SIDEBAR_ON_INTERACT"),
  start: l10n("SIDEBAR_ON_INIT"),
  update: l10n("SIDEBAR_ON_UPDATE"),
};

const collisionTabs = {
  hit: l10n("SIDEBAR_ON_HIT"),
  start: l10n("SIDEBAR_ON_INIT"),
  update: l10n("SIDEBAR_ON_UPDATE"),
};

const hitTabs = {
  hitPlayer: l10n("FIELD_PLAYER"),
  hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
  hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
  hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
};

class ActorEditor extends Component {
  constructor(props) {
    super(props);

    const tabs = Object.keys(
      props.actor && props.actor.collisionGroup ? collisionTabs : defaultTabs
    );
    const secondaryTabs = Object.keys(hitTabs);

    const initialTab = tabs.includes(props.lastScriptTab)
      ? props.lastScriptTab
      : tabs[0];
    const initialSecondaryTab = secondaryTabs.includes(
      props.lastScriptTabSecondary
    )
      ? props.lastScriptTabSecondary
      : secondaryTabs[0];

    this.state = {
      clipboardData: null,
      scriptMode: initialTab,
      scriptModeSecondary: initialSecondaryTab,
    };
  }

  onSetScriptMode = (mode) => {
    const { setScriptTab } = this.props;
    setScriptTab(mode);
    this.setState({
      scriptMode: mode,
    });
  };

  onSetScriptModeSecondary = (mode) => {
    const { setScriptTabSecondary } = this.props;
    setScriptTabSecondary(mode);
    this.setState({
      scriptModeSecondary: mode,
    });
  };

  onEdit = (key) => (e) => {
    const { editActor, actor } = this.props;
    const { scriptMode } = this.state;

    if (key === "collisionGroup" && scriptMode === "hit" && !e) {
      this.onSetScriptMode("interact");
    }
    if (key === "collisionGroup" && scriptMode === "interact" && e) {
      this.onSetScriptMode("hit");
    }

    editActor({actorId: actor.id, changes:{
      [key]: castEventValue(e),
    }});
  };

  onEditScript = this.onEdit("script");

  onEditStartScript = this.onEdit("startScript");

  onEditUpdateScript = this.onEdit("updateScript");

  onEditHit1Script = this.onEdit("hit1Script");

  onEditHit2Script = this.onEdit("hit2Script");

  onEditHit3Script = this.onEdit("hit3Script");

  onCopy = (e) => {
    const { copyActor, actor } = this.props;
    copyActor(actor);
  };

  onPaste = (e) => {
    const { pasteClipboardEntity } = this.props;
    const { clipboardData } = this.state;
    pasteClipboardEntity(clipboardData);
  };

  onRemove = (e) => {
    const { removeActor, sceneId, actor } = this.props;
    removeActor({ sceneId, actorId: actor.id });
  };

  readClipboard = (e) => {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      this.setState({ clipboardData });
    } catch (err) {
      this.setState({ clipboardData: null });
    }
  };

  render() {
    const {
      index,
      actor,
      scene,
      spriteSheet,
      selectSidebar,
      colorsEnabled,
      defaultSpritePaletteId,
    } = this.props;
    const { clipboardData, scriptMode, scriptModeSecondary } = this.state;

    if (!actor) {
      return <WorldEditor />;
    }

    const showDirectionInput =
      spriteSheet &&
      spriteSheet.type !== SPRITE_TYPE_STATIC &&
      spriteSheet.type !== SPRITE_TYPE_ANIMATED &&
      actor.spriteType !== SPRITE_TYPE_STATIC;

    const showFrameInput =
      spriteSheet &&
      spriteSheet.numFrames > 1 &&
      actor.spriteType === SPRITE_TYPE_STATIC;

    const showAnimatedCheckbox =
      actor.animSpeed !== "" &&
      spriteSheet &&
      spriteSheet.numFrames > 1 &&
      (actor.spriteType === SPRITE_TYPE_STATIC ||
        spriteSheet.type !== SPRITE_TYPE_ACTOR);

    const showAnimSpeed =
      spriteSheet &&
      (spriteSheet.type === SPRITE_TYPE_ACTOR_ANIMATED ||
        (actor.spriteType === SPRITE_TYPE_STATIC && spriteSheet.numFrames > 1));

    const showCollisionGroup =
      !actor.isPinned;

    const scripts = {
      start: {
        value: actor.startScript,
        onChange: this.onEditStartScript,
      },
      interact: {
        value: actor.script,
        onChange: this.onEditScript,
      },
      update: {
        value: actor.updateScript,
        onChange: this.onEditUpdateScript,
      },
      hit: {
        tabs: hitTabs,
        hitPlayer: {
          value: actor.script,
          onChange: this.onEditScript,
        },
        hit1: {
          value: actor.hit1Script,
          onChange: this.onEditHit1Script,
        },
        hit2: {
          value: actor.hit2Script,
          onChange: this.onEditHit2Script,
        },
        hit3: {
          value: actor.hit3Script,
          onChange: this.onEditHit3Script,
        },
      },
    };

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
                {clipboardData && clipboardData.__type === "actor" && (
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
                    actor.spriteType === SPRITE_TYPE_STATIC
                      ? actor.frame
                      : 0
                  }
                  onChange={this.onEdit("spriteSheetId")}
                />
              </label>
            </FormField>

            {colorsEnabled && (
              <ToggleableFormField
                htmlFor="actorPalette"
                closedLabel={l10n("FIELD_PALETTE")}
                label={l10n("FIELD_PALETTE")}
                open={!!actor.paletteId}
              >
                <PaletteSelect
                  id="actorPalette"
                  value={actor.paletteId || ""}
                  optional
                  optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                  optionalDefaultPaletteId={defaultSpritePaletteId || ""}
                  onChange={this.onEdit("paletteId")}
                />
              </ToggleableFormField>
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

            {spriteSheet &&
              spriteSheet.type !== "static" &&
              spriteSheet.type !== "animated" && (
                <FormField halfWidth>
                  <label htmlFor="actorMovement">
                    {l10n("FIELD_ACTOR_TYPE")}
                    <SpriteTypeSelect
                      id="actorMovement"
                      value={actor.spriteType}
                      onChange={this.onEdit("spriteType")}
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
                  {l10n("FIELD_ANIMATE_WHEN_STATIONARY")}
                </label>
              </FormField>
            )}

            <div />

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

            <div />

            {showCollisionGroup && (
              <FormField halfWidth>
                <label htmlFor="actorCollisionGroup">
                  {l10n("FIELD_COLLISION_GROUP")}
                  <CollisionMaskPicker
                    id="actorCollisionGroup"
                    value={actor.collisionGroup}
                    onChange={this.onEdit("collisionGroup")}
                  />
                </label>
              </FormField>
            )}

            <FormField>
              <label htmlFor="actorIsPinned">
                <input
                  id="actorIsPinned"
                  type="checkbox"
                  className="Checkbox"
                  checked={actor.isPinned}
                  onChange={this.onEdit("isPinned")}
                />
                <div className="FormCheckbox" />
                Pin to screen
              </label>
            </FormField>

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
                selectScene({ sceneId: scene.id });
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
          <div>
            <SidebarTabs
              value={scriptMode}
              values={actor.collisionGroup ? collisionTabs : defaultTabs}
              onChange={this.onSetScriptMode}
              buttons={
                scripts[scriptMode] &&
                !scripts[scriptMode].tabs && (
                  <ScriptEditorDropdownButton
                    value={scripts[scriptMode].value}
                    onChange={scripts[scriptMode].onChange}
                  />
                )
              }
            />
            {scripts[scriptMode] && scripts[scriptMode].tabs && (
              <SidebarTabs
                secondary
                value={scriptModeSecondary}
                values={scripts[scriptMode].tabs}
                onChange={this.onSetScriptModeSecondary}
                buttons={
                  <ScriptEditorDropdownButton
                    value={scripts[scriptMode][scriptModeSecondary].value}
                    onChange={scripts[scriptMode][scriptModeSecondary].onChange}
                  />
                }
              />
            )}
            {scripts[scriptMode] && !scripts[scriptMode].tabs && (
              <ScriptEditor
                value={scripts[scriptMode].value}
                type="actor"
                onChange={scripts[scriptMode].onChange}
                entityId={actor.id}
              />
            )}
            {scripts[scriptMode] &&
              scripts[scriptMode].tabs &&
              scripts[scriptMode][scriptModeSecondary] && (
                <ScriptEditor
                  value={scripts[scriptMode][scriptModeSecondary].value}
                  type="actor"
                  onChange={scripts[scriptMode][scriptModeSecondary].onChange}
                  entityId={actor.id}
                />
              )}

            {scriptMode === "update" &&
              (!scripts.update.value || scripts.update.value.length <= 1) && (
                <div className="ScriptEditor__Presets">
                  <div className="ScriptEditor__PresetsLabel">
                    {l10n("FIELD_OR_CHOOSE_PRESET")}
                  </div>
                  <div className="ScriptEditor__PresetsButtons">
                    <Button
                      onClick={() => {
                        this.onEditUpdateScript(generateRandomWalkScript());
                      }}
                    >
                      {l10n("FIELD_MOVEMENT_RANDOM_WALK")}
                    </Button>
                    <Button
                      onClick={() => {
                        this.onEditUpdateScript(generateRandomLookScript());
                      }}
                    >
                      {l10n("FIELD_MOVEMENT_RANDOM_ROTATION")}
                    </Button>
                  </div>
                </div>
              )}
          </div>
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
  lastScriptTab: PropTypes.string.isRequired,
  lastScriptTabSecondary: PropTypes.string.isRequired,
  spriteSheet: SpriteShape,
  defaultSpritePaletteId: PropTypes.string.isRequired,
  colorsEnabled: PropTypes.bool.isRequired,
  editActor: PropTypes.func.isRequired,
  removeActor: PropTypes.func.isRequired,
  copyActor: PropTypes.func.isRequired,
  pasteClipboardEntity: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired,
  setScriptTab: PropTypes.func.isRequired,
  setScriptTabSecondary: PropTypes.func.isRequired,
};

ActorEditor.defaultProps = {
  actor: null,
  scene: null,
  spriteSheet: null,
};

function mapStateToProps(state, props) {
  const actor = actorSelectors.selectById(state, props.id);
  const scene = sceneSelectors.selectById(state, props.sceneId);
  const spriteSheet = actor && spriteSheetSelectors.selectById(state, actor.spriteSheetId);
  const index = scene.actors.indexOf(props.id);
  const settings = getSettings(state);
  const colorsEnabled = settings.customColorsEnabled;
  const defaultSpritePaletteId =
    settings.defaultSpritePaletteId || DMG_PALETTE.id;
  const { lastScriptTab, lastScriptTabSecondary } = state.editor;
  return {
    index,
    actor,
    scene,
    spriteSheet,
    colorsEnabled,
    defaultSpritePaletteId,
    lastScriptTab,
    lastScriptTabSecondary,
  };
}

const mapDispatchToProps = {
  editActor: entitiesActions.editActor,
  removeActor: entitiesActions.removeActor,
  copyActor: clipboardActions.copyActor,
  pasteClipboardEntity: clipboardActions.pasteClipboardEntity,
  selectScene: editorActions.selectScene,
  selectSidebar: editorActions.selectSidebar,
  setScriptTab: editorActions.setScriptTab,
  setScriptTabSecondary: editorActions.setScriptTabSecondary,
};

export default connect(mapStateToProps, mapDispatchToProps)(ActorEditor);
