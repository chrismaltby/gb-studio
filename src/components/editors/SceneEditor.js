import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { TriggerIcon } from "../../components/library/Icons";
import BackgroundSelect from "../forms/BackgroundSelect";
import { FormField } from "../../components/library/Forms";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "../../lib/helpers/castEventValue";
import SidebarHeading from "./SidebarHeading";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";

class SceneEditor extends Component {
  onEdit = key => e => {
    this.props.editScene(this.props.id, {
      [key]: castEventValue(e)
    });
  };

  onCopy = e => {
    this.props.copyScene(this.props.scene);
  };

  onPaste = e => {
    const { clipboardScene } = this.props;
    this.props.pasteScene(clipboardScene);
  };

  onPasteActor = e => {
    const { scene, clipboardActor } = this.props;
    this.props.pasteActor(scene.id, clipboardActor);
  };

  onPasteTrigger = e => {
    const { scene, clipboardTrigger } = this.props;
    this.props.pasteTrigger(scene.id, clipboardTrigger);
  };

  onRemove = e => {
    this.props.removeScene(this.props.id);
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
      <div>
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
            <label htmlFor="sceneName">{l10n("FIELD_NAME")}</label>
            <input
              id="sceneName"
              placeholder={"Scene " + (sceneIndex + 1)}
              value={scene.name}
              onChange={this.onEdit("name")}
            />
          </FormField>

          <FormField>
            <label htmlFor="sceneType">{l10n("FIELD_TYPE")}</label>
            <select id="sceneType">
              <option>Top Down 2D</option>
            </select>
          </FormField>

          <FormField>
            <label htmlFor="sceneImage">{l10n("FIELD_BACKGROUND")}</label>
            <BackgroundSelect
              id="sceneImage"
              value={scene.backgroundId}
              onChange={this.onEdit("backgroundId")}
            />
          </FormField>
        </div>

        {(scene.actors.length > 0 || scene.triggers.length > 0) && (
          <div>
            <SidebarHeading title={l10n("SIDEBAR_NAVIGATION")} />
            <ul>
              {scene.actors.map((actor, index) => (
                <li
                  key={actor.id}
                  onClick={() => this.props.selectActor(scene.id, actor.id)}
                >
                  <div className="EditorSidebar__Icon">
                    <SpriteSheetCanvas
                      spriteSheetId={actor.spriteSheetId}
                      direction={actor.direction}
                    />
                  </div>
                  {actor.name || "Actor " + (index + 1)}
                </li>
              ))}
              {scene.triggers.map((trigger, index) => (
                <li
                  key={trigger.id}
                  onClick={() => this.props.selectTrigger(scene.id, trigger.id)}
                >
                  <div className="EditorSidebar__Icon">
                    <TriggerIcon />
                  </div>
                  {trigger.name || "Trigger " + (index + 1)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ScriptEditor
          value={scene.script}
          title={l10n("SIDEBAR_SCENE_START_SCRIPT")}
          type="scene"
          onChange={this.onEdit("script")}
        />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const hasScenes = state.project.present && state.project.present.scenes;
  const sceneIndex = hasScenes
    ? state.project.present.scenes.findIndex(scene => scene.id === props.id)
    : -1;
  return {
    sceneIndex,
    scene: sceneIndex != -1 && state.project.present.scenes[sceneIndex],
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
