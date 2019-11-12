/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import * as actions from "../../actions";
import BackgroundSelect from "../forms/BackgroundSelect";
import { FormField, ToggleableFormField } from "../library/Forms";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "../../lib/helpers/castEventValue";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import Sidebar, { SidebarHeading, SidebarColumn, SidebarTabs } from "./Sidebar";
import { SceneShape } from "../../reducers/stateShape";
import SceneNavigation from "./SceneNavigation";
import WorldEditor from "./WorldEditor";

class SceneEditor extends Component {
  constructor() {
    super();
    this.state = {
      clipboardActor: null,
      clipboardScene: null,
      clipboardTrigger: null
    };
  }

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
    const { setScenePrefab } = this.props;
    const { clipboardScene } = this.state;
    setScenePrefab(clipboardScene);
  };

  onPasteActor = e => {
    const { setActorPrefab } = this.props;
    const { clipboardActor } = this.state;
    setActorPrefab(clipboardActor);
  };

  onPasteTrigger = e => {
    const { setTriggerPrefab } = this.props;
    const { clipboardTrigger } = this.state;
    setTriggerPrefab(clipboardTrigger);
  };

  readClipboard = e => {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__type === "actor") {
        this.setState({
          clipboardActor: clipboardData,
          clipboardTrigger: null,
          clipboardScene: null
        });
      } else if (clipboardData.__type === "trigger") {
        this.setState({
          clipboardActor: null,
          clipboardTrigger: clipboardData,
          clipboardScene: null
        });
      } else if (clipboardData.__type === "scene") {
        this.setState({
          clipboardActor: null,
          clipboardTrigger: null,
          clipboardScene: clipboardData
        });
      } else {
        this.setState({
          clipboardActor: null,
          clipboardTrigger: null,
          clipboardScene: null
        });
      }
    } catch (err) {
      this.setState({
        clipboardActor: null,
        clipboardTrigger: null,
        clipboardScene: null
      });
    }
  };

  onRemove = e => {
    const { removeScene, scene } = this.props;
    removeScene(scene.id);
  };

  render() {
    const { scene, sceneIndex, selectSidebar } = this.props;

    if (!scene) {
      return <WorldEditor />;
    }

    const { clipboardScene, clipboardActor, clipboardTrigger } = this.state;

    const renderScriptHeader = ({ buttons }) => (
      <SidebarTabs
        values={{
          init: l10n("SIDEBAR_ON_INIT")
        }}
        buttons={buttons}
      />
    );

    return (
      <Sidebar onMouseDown={selectSidebar}>
        <SidebarColumn>
          <SidebarHeading
            title={l10n("SCENE")}
            buttons={
              <DropdownButton
                small
                transparent
                right
                onMouseDown={this.readClipboard}
              >
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

          <SceneNavigation sceneId={scene.id} />
        </SidebarColumn>

        <SidebarColumn>
          <ScriptEditor
            value={scene.script}
            renderHeader={renderScriptHeader}
            type="scene"
            onChange={this.onEdit("script")}
            entityId={scene.id}
          />
        </SidebarColumn>
      </Sidebar>
    );
  }
}

SceneEditor.propTypes = {
  scene: SceneShape,
  sceneIndex: PropTypes.number.isRequired,
  editScene: PropTypes.func.isRequired,
  removeScene: PropTypes.func.isRequired,
  copyScene: PropTypes.func.isRequired,
  setScenePrefab: PropTypes.func.isRequired,
  setActorPrefab: PropTypes.func.isRequired,
  setTriggerPrefab: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired
};

SceneEditor.defaultProps = {
  scene: null
};

function mapStateToProps(state, props) {
  const scene = state.entities.present.entities.scenes[props.id];
  const sceneIndex = state.entities.present.result.scenes.indexOf(props.id);
  return {
    sceneIndex,
    scene
  };
}

const mapDispatchToProps = {
  editScene: actions.editScene,
  removeScene: actions.removeScene,
  selectActor: actions.selectActor,
  selectTrigger: actions.selectTrigger,
  copyScene: actions.copyScene,
  setScenePrefab: actions.setScenePrefab,
  setActorPrefab: actions.setActorPrefab,
  setTriggerPrefab: actions.setTriggerPrefab,
  selectSidebar: actions.selectSidebar
};

export default connect(mapStateToProps, mapDispatchToProps)(SceneEditor);
