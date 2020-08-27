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
import PaletteSelect, { DMG_PALETTE } from "../forms/PaletteSelect";
import { getSettings } from "../../reducers/entitiesReducer";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import LabelButton from "../library/LabelButton";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import BackgroundWarnings from "../world/BackgroundWarnings";
import { sceneSelectors, actions as entityActions } from "../../store/features/entities/entitiesSlice";

const defaultTabs = {
  start: l10n("SIDEBAR_ON_INIT"),
  hit: l10n("SIDEBAR_ON_PLAYER_HIT"),
};

const hitTabs = {
  hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
  hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
  hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
};

class SceneEditor extends Component {
  constructor(props) {
    super(props);

    const tabs = Object.keys(defaultTabs);
    const secondaryTabs = Object.keys(hitTabs);

    const initialTab = tabs.includes(props.lastScriptTab) ? props.lastScriptTab : tabs[0];
    const initialSecondaryTab = secondaryTabs.includes(props.lastScriptTabSecondary) ? props.lastScriptTabSecondary : secondaryTabs[0];

    this.state = {
      showHiddenSceneTypes: false,
      clipboardData: null,
      scriptMode: initialTab,
      scriptModeSecondary: initialSecondaryTab
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.detectHiddenMode);
    window.addEventListener("keyup", this.detectHiddenMode);
    window.addEventListener("blur", this.onBlur);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.detectHiddenMode);
    window.removeEventListener("keyup", this.detectHiddenMode);
    window.removeEventListener("blur", this.onBlur);
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

  // shouldComponentUpdate(nextProps, nextState) {
  //   rerenderCheck("SceneEditor", this.props, {}, nextProps, {});
  //   return true;
  // }

  onEdit = (key) => (e) => {
    const { editScene, scene } = this.props;
    editScene({sceneId: scene.id, changes: {
      [key]: castEventValue(e),
    }});
  };

  onCopy = (e) => {
    const { copyScene, scene } = this.props;
    copyScene(scene);
  };

  onPaste = (e) => {
    const { pasteClipboardEntity } = this.props;
    const { clipboardData } = this.state;
    pasteClipboardEntity(clipboardData);
  };

  onEditScript = this.onEdit("script");

  onEditPlayerHit1Script = this.onEdit("playerHit1Script");

  onEditPlayerHit2Script = this.onEdit("playerHit2Script");

  onEditPlayerHit3Script = this.onEdit("playerHit3Script");

  detectHiddenMode = e => {
    this.setState({ showHiddenSceneTypes: e.shiftKey });
  };

  onBlur = e => {
    this.setState({ showHiddenSceneTypes: false });
  };

  readClipboard = (e) => {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      this.setState({ clipboardData });
    } catch (err) {
      this.setState({ clipboardData: null });
    }
  };

  onRemove = (e) => {
    const { removeScene, scene } = this.props;
    removeScene(scene.id);
  };
  
  onEditPaletteId = (index) => (e) => {
    const { scene } = this.props;
    const paletteIds = scene.paletteIds ? [...scene.paletteIds] : [];
    paletteIds[index] = castEventValue(e);
    this.onEdit("paletteIds")(paletteIds);
  };

  render() {
    const {
      scene,
      sceneIndex,
      selectSidebar,
      colorsEnabled,
      defaultBackgroundPaletteIds,
    } = this.props;

    if (!scene) {
      return <WorldEditor />;
    }

    const {
      clipboardData,
      scriptMode,
      scriptModeSecondary,
      showHiddenSceneTypes
    } = this.state;

    const scripts = {
      start: {
        value: scene.script,
        onChange: this.onEditScript,
      },
      hit: {
        tabs: hitTabs,
        hit1: {
          value: scene.playerHit1Script,
          onChange: this.onEditPlayerHit1Script,
        },
        hit2: {
          value: scene.playerHit2Script,
          onChange: this.onEditPlayerHit2Script,
        },
        hit3: {
          value: scene.playerHit3Script,
          onChange: this.onEditPlayerHit3Script,
        },
      },
    };

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
                <MenuItem style={{ paddingRight: 10, marginBottom: 5 }}>
                  <div style={{ display: "flex" }}>
                    <div style={{ marginRight: 5 }}>
                      <LabelButton
                        onClick={() => this.onEdit("labelColor")("")}
                      />
                    </div>
                    {[
                      "red",
                      "orange",
                      "yellow",
                      "green",
                      "blue",
                      "purple",
                      "gray",
                    ].map((color) => (
                      <div
                        key={color}
                        style={{ marginRight: color === "gray" ? 0 : 5 }}
                      >
                        <LabelButton
                          color={color}
                          onClick={() => this.onEdit("labelColor")(color)}
                        />
                      </div>
                    ))}
                  </div>
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={this.onCopy}>
                  {l10n("MENU_COPY_SCENE")}
                </MenuItem>
                {clipboardData && clipboardData.__type === "scene" && (
                  <MenuItem onClick={this.onPaste}>
                    {l10n("MENU_PASTE_SCENE")}
                  </MenuItem>
                )}
                {clipboardData && clipboardData.__type === "actor" && (
                  <MenuItem onClick={this.onPaste}>
                    {l10n("MENU_PASTE_ACTOR")}
                  </MenuItem>
                )}
                {clipboardData && clipboardData.__type === "trigger" && (
                  <MenuItem onClick={this.onPaste}>
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
                <select
                  id="sceneType"
                  value={scene.type}
                  onChange={this.onEdit("type")}
                >
                  <option value="0">{l10n("GAMETYPE_TOP_DOWN")}</option>
                  <option value="1">{l10n("GAMETYPE_PLATFORMER")}</option>
                  {(showHiddenSceneTypes || scene.type === "2") &&
                    <option value="2">{l10n("GAMETYPE_ADVENTURE")} ({l10n("FIELD_WORK_IN_PROGRESS")})</option>
                  }
                  <option value="3">{l10n("GAMETYPE_SHMUP")}</option>
                  <option value="4">{l10n("GAMETYPE_POINT_N_CLICK")}</option>
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
              <BackgroundWarnings id={scene.backgroundId} />
            </FormField>

            {colorsEnabled && (
              <ToggleableFormField
                htmlFor="scenePalette"
                closedLabel={l10n("FIELD_PALETTES")}
                label={l10n("FIELD_PALETTES")}
                open={
                  !!scene.paletteIds &&
                  scene.paletteIds.filter((i) => i).length > 0
                }
              >
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <PaletteSelect
                    key={index}
                    id="scenePalette"
                    value={(scene.paletteIds && scene.paletteIds[index]) || ""}
                    prefix={`${index + 1}: `}
                    onChange={this.onEditPaletteId(index)}
                    optional
                    optionalDefaultPaletteId={
                      defaultBackgroundPaletteIds[index] || ""
                    }
                    optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                  />
                ))}
              </ToggleableFormField>
            )}

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
          <div>
            <SidebarTabs
              value={scriptMode}
              values={defaultTabs}
              onChange={this.onSetScriptMode}
              buttons={
                scripts[scriptMode] && !scripts[scriptMode].tabs && (
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
                type="scene"
                onChange={scripts[scriptMode].onChange}
                entityId={scene.id}
              />
            )}
            {scripts[scriptMode] && scripts[scriptMode].tabs && scripts[scriptMode][scriptModeSecondary] && (
              <ScriptEditor
                value={scripts[scriptMode][scriptModeSecondary].value}
                type="scene"
                onChange={scripts[scriptMode][scriptModeSecondary].onChange}
                entityId={scene.id}
              />
            )}            
          </div>
        </SidebarColumn>
      </Sidebar>
    );
  }
}

SceneEditor.propTypes = {
  scene: SceneShape,
  sceneIndex: PropTypes.number.isRequired,
  lastScriptTab: PropTypes.string.isRequired,
  lastScriptTabSecondary: PropTypes.string.isRequired,  
  editScene: PropTypes.func.isRequired,
  removeScene: PropTypes.func.isRequired,
  copyScene: PropTypes.func.isRequired,
  pasteClipboardEntity: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired,
  setScriptTab: PropTypes.func.isRequired,
  setScriptTabSecondary: PropTypes.func.isRequired  
};

SceneEditor.defaultProps = {
  scene: null,
};

function mapStateToProps(state, props) {
  const scene = sceneSelectors.selectById(state.project.present.entities, props.id);
  const sceneIndex = sceneSelectors.selectIds(state.project.present.entities).indexOf(props.id);
  const settings = getSettings(state);
  const colorsEnabled = settings.customColorsEnabled;
  const defaultBackgroundPaletteIds =
    settings.defaultBackgroundPaletteIds || [];
  const { lastScriptTabScene: lastScriptTab, lastScriptTabSecondary } = state.editor;    
  return {
    sceneIndex,
    scene,
    colorsEnabled,
    defaultBackgroundPaletteIds,
    lastScriptTab,
    lastScriptTabSecondary    
  };
}

const mapDispatchToProps = {
  editScene: entityActions.editScene,
  removeScene: actions.removeScene,
  selectActor: actions.selectActor,
  selectTrigger: actions.selectTrigger,
  copyScene: actions.copyScene,
  pasteClipboardEntity: actions.pasteClipboardEntity,
  selectSidebar: actions.selectSidebar,
  setScriptTab: actions.setScriptTabScene,
  setScriptTabSecondary: actions.setScriptTabSecondary  
};

export default connect(mapStateToProps, mapDispatchToProps)(SceneEditor);
