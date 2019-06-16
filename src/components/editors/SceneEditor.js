/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import * as actions from "../../actions";
import { TriggerIcon } from "../library/Icons";
import BackgroundSelect from "../forms/BackgroundSelect";
import { FormField, ToggleableFormField } from "../library/Forms";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "../../lib/helpers/castEventValue";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import { MAX_ACTORS, MAX_TRIGGERS } from "../../consts";
import Sidebar, { SidebarHeading, SidebarColumn } from "./Sidebar";
import {
  SceneShape,
  ActorShape,
  TriggerShape
} from "../../reducers/stateShape";

class SceneEditor extends Component {
  onEdit = key => e => {
    const { editScene, scene } = this.props;
    editScene(scene.id, {
      [key]: castEventValue(e)
    });
  };

  onCopy = e => {
    const { copyScene, scene } = this.props;
    copyScene(scene);
  };

  onPaste = e => {
    const { pasteScene, clipboardScene } = this.props;
    pasteScene(clipboardScene);
  };

  onPasteActor = e => {
    const { pasteActor, scene, clipboardActor } = this.props;
    pasteActor(scene.id, clipboardActor);
  };

  onPasteTrigger = e => {
    const { pasteTrigger, scene, clipboardTrigger } = this.props;
    pasteTrigger(scene.id, clipboardTrigger);
  };

  onRemove = e => {
    const { removeScene, scene } = this.props;
    removeScene(scene.id);
  };

  render() {
    const {
      scene,
      sceneIndex,
      clipboardScene,
      clipboardActor,
      clipboardTrigger
    } = this.props;

    if (!scene) {
      return <div />;
    }

    return (
      <Sidebar>
        <SidebarColumn>
          <SidebarHeading
            title={l10n("SCENE")}
            buttons={
              <DropdownButton small transparent right>
                <MenuItem onClick={this.onCopy}>
                  {l10n("MENU_COPY_SCENE")}
                </MenuItem>
                {clipboardScene && (
                  <MenuItem onClick={this.onPaste}>
                    {l10n("MENU_PASTE_SCENE")}
                  </MenuItem>
                )}
                {clipboardActor && (
                  <MenuItem onClick={this.onPasteActor}>
                    {l10n("MENU_PASTE_ACTOR")}
                  </MenuItem>
                )}
                {clipboardTrigger && (
                  <MenuItem onClick={this.onPasteTrigger}>
                    {l10n("MENU_PASTE_TRIGGER")}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={this.onRemove}>
                  {l10n("MENU_DELETE_SCENE")}
                </MenuItem>
              </DropdownButton>
            }
          />
          <div>
            <FormField>
              <label htmlFor="sceneName">
                {l10n("FIELD_NAME")}
                <input
                  id="sceneName"
                  placeholder={`Scene ${sceneIndex + 1}`}
                  value={scene.name}
                  onChange={this.onEdit("name")}
                />
              </label>
            </FormField>

            <FormField>
              <label htmlFor="sceneType">
                {l10n("FIELD_TYPE")}
                <select id="sceneType">
                  <option>Top Down 2D</option>
                </select>
              </label>
            </FormField>

            <FormField>
              <label htmlFor="sceneImage">
                {l10n("FIELD_BACKGROUND")}
                <BackgroundSelect
                  id="sceneImage"
                  value={scene.backgroundId}
                  onChange={this.onEdit("backgroundId")}
                />
              </label>
            </FormField>

            <ToggleableFormField
              htmlFor="sceneNotes"
              closedLabel={l10n("FIELD_ADD_NOTES")}
              label={l10n("FIELD_NOTES")}
              open={!!scene.notes}
            >
              <textarea
                id="sceneNotes"
                value={scene.notes || ""}
                placeholder={l10n("FIELD_NOTES")}
                onChange={this.onEdit("notes")}
                rows={3}
              />
            </ToggleableFormField>
          </div>

          {(scene.actors.length > 0 || scene.triggers.length > 0) && (
            <div>
              <SidebarHeading title={l10n("SIDEBAR_NAVIGATION")} />
              <ul>
                {scene.actors.map((actor, index) => (
                  <li
                    key={actor.id}
                    onClick={() => {
                      const { selectActor } = this.props;
                      selectActor(scene.id, actor.id);
                    }}
                    className={cx({ Navigation__Error: index >= MAX_ACTORS })}
                  >
                    <div className="EditorSidebar__Icon">
                      <SpriteSheetCanvas
                        spriteSheetId={actor.spriteSheetId}
                        direction={actor.direction}
                      />
                    </div>
                    {actor.name || `Actor ${index + 1}`}
                  </li>
                ))}
                {scene.triggers.map((trigger, index) => (
                  <li
                    key={trigger.id}
                    onClick={() => {
                      const { selectTrigger } = this.props;
                      selectTrigger(scene.id, trigger.id);
                    }}
                    className={cx({ Navigation__Error: index >= MAX_TRIGGERS })}
                  >
                    <div className="EditorSidebar__Icon">
                      <TriggerIcon />
                    </div>
                    {trigger.name || `Trigger ${index + 1}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SidebarColumn>

        <SidebarColumn>
          <ScriptEditor
            value={scene.script}
            title={l10n("SIDEBAR_SCENE_START_SCRIPT")}
            type="scene"
            onChange={this.onEdit("script")}
          />
        </SidebarColumn>
      </Sidebar>
    );
  }
}

SceneEditor.propTypes = {
  scene: SceneShape,
  sceneIndex: PropTypes.number.isRequired,
  clipboardScene: SceneShape,
  clipboardActor: ActorShape,
  clipboardTrigger: TriggerShape,
  editScene: PropTypes.func.isRequired,
  removeScene: PropTypes.func.isRequired,
  selectActor: PropTypes.func.isRequired,
  selectTrigger: PropTypes.func.isRequired,
  copyScene: PropTypes.func.isRequired,
  pasteScene: PropTypes.func.isRequired,
  pasteActor: PropTypes.func.isRequired,
  pasteTrigger: PropTypes.func.isRequired
};

SceneEditor.defaultProps = {
  scene: null,
  clipboardScene: null,
  clipboardActor: null,
  clipboardTrigger: null
};

function mapStateToProps(state, props) {
  // const hasScenes = state.project.present && state.project.present.scenes;
  // const sceneIndex = hasScenes
  //   ? state.project.present.scenes.findIndex(scene => scene.id === props.id)
  //   : -1;
  const scene = state.entities.present.entities.scenes[props.id];
  const sceneIndex = state.entities.present.result.scenes.indexOf(props.id);
  return {
    sceneIndex,
    scene,
    clipboardScene: state.clipboard.scene,
    clipboardActor: state.clipboard.actor,
    clipboardTrigger: state.clipboard.trigger
  };
}

const mapDispatchToProps = {
  editScene: actions.editScene,
  removeScene: actions.removeScene,
  selectActor: actions.selectActor,
  selectTrigger: actions.selectTrigger,
  copyScene: actions.copyScene,
  pasteScene: actions.pasteScene,
  pasteActor: actions.pasteActor,
  pasteTrigger: actions.pasteTrigger
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SceneEditor);
