/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as actions from "../../actions";
import SceneSelect from "../forms/SceneSelect";
import DirectionPicker from "../forms/DirectionPicker";
import SpriteSheetSelect from "../forms/SpriteSheetSelect";
import { FormField, ToggleableFormField } from "../library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";
import MovementSpeedSelect from "../forms/MovementSpeedSelect";
import AnimationSpeedSelect from "../forms/AnimationSpeedSelect";
import Sidebar, { SidebarHeading, SidebarColumn } from "./Sidebar";
import { ProjectShape } from "../../reducers/stateShape";
import Button from "../library/Button";
import CustomEventNavigation from "./CustomEventNavigation";

class WorldEditor extends Component {
  onEditSetting = key => e => {
    const { editProjectSettings } = this.props;
    editProjectSettings({
      [key]: castEventValue(e)
    });
  };

  onEditProject = key => e => {
    const { editProject } = this.props;
    editProject({
      [key]: castEventValue(e)
    });
  };

  render() {
    const { project, selectSidebar, addCustomEvent } = this.props;

    if (!project || !project.scenes || !project.customEvents) {
      return <div />;
    }

    const { name, author, notes, scenes, settings } = project;
    const {
      startSceneId,
      playerSpriteSheetId,
      startDirection,
      startAnimSpeed,
      startMoveSpeed,
      startX,
      startY
    } = settings;

    return (
      <Sidebar onMouseDown={selectSidebar}>
        <SidebarColumn>
          <SidebarHeading title={l10n("PROJECT")} />

          <div>
            <FormField>
              <label htmlFor="projectName">
                {l10n("FIELD_NAME")}
                <input
                  id="projectName"
                  value={name || ""}
                  placeholder="Project Name"
                  onChange={this.onEditProject("name")}
                />
              </label>
            </FormField>

            <FormField>
              <label htmlFor="projectAuthor">
                {l10n("FIELD_AUTHOR")}
                <input
                  id="projectAuthor"
                  value={author || ""}
                  placeholder="Author"
                  onChange={this.onEditProject("author")}
                />
              </label>
            </FormField>

            <ToggleableFormField
              htmlFor="projectNotes"
              closedLabel={l10n("FIELD_ADD_NOTES")}
              label={l10n("FIELD_NOTES")}
              open={!!notes}
            >
              <textarea
                id="projectNotes"
                value={notes || ""}
                placeholder={l10n("FIELD_NOTES")}
                onChange={this.onEditProject("notes")}
                rows={3}
              />
            </ToggleableFormField>
          </div>

          {scenes.length > 0 && (
            <div>
              <SidebarHeading title={l10n("SIDEBAR_STARTING_SCENE")} />

              <FormField>
                <SceneSelect
                  id="startScene"
                  value={startSceneId || ""}
                  onChange={this.onEditSetting("startSceneId")}
                />
              </FormField>

              <FormField>
                <label htmlFor="playerSprite">
                  {l10n("FIELD_PLAYER_SPRITE_SHEET")}
                  <SpriteSheetSelect
                    id="playerSprite"
                    value={playerSpriteSheetId}
                    direction={startDirection}
                    onChange={this.onEditSetting("playerSpriteSheetId")}
                  />
                </label>
              </FormField>

              <FormField halfWidth>
                <label htmlFor="startX">
                  {l10n("FIELD_X")}
                  <input
                    id="startX"
                    type="number"
                    value={startX}
                    min={0}
                    max={30}
                    placeholder={0}
                    onChange={this.onEditSetting("startX")}
                  />
                </label>
              </FormField>

              <FormField halfWidth>
                <label htmlFor="startY">
                  {l10n("FIELD_Y")}
                  <input
                    id="startY"
                    type="number"
                    value={startY}
                    min={0}
                    max={31}
                    placeholder={0}
                    onChange={this.onEditSetting("startY")}
                  />
                </label>
              </FormField>

              <FormField>
                <label htmlFor="startDirection">
                  {l10n("FIELD_DIRECTION")}
                  <DirectionPicker
                    id="startDirection"
                    value={startDirection || 0}
                    onChange={this.onEditSetting("startDirection")}
                  />
                </label>
              </FormField>

              <FormField halfWidth>
                <label htmlFor="startMoveSpeed">
                  {l10n("FIELD_MOVEMENT_SPEED")}
                  <MovementSpeedSelect
                    id="startMoveSpeed"
                    value={startMoveSpeed}
                    onChange={this.onEditSetting("startMoveSpeed")}
                  />
                </label>
              </FormField>

              <FormField halfWidth>
                <label htmlFor="startAnimSpeed">
                  {l10n("FIELD_ANIMATION_SPEED")}
                  <AnimationSpeedSelect
                    id="startAnimSpeed"
                    value={startAnimSpeed}
                    onChange={this.onEditSetting("startAnimSpeed")}
                  />
                </label>
              </FormField>
            </div>
          )}
        </SidebarColumn>

        <SidebarColumn>
          <div>
            <SidebarHeading title={l10n("SIDEBAR_CUSTOM_EVENTS")} />
            <CustomEventNavigation />
            <div style={{ padding: "10px" }}>
              <Button
                style={{ width: "100%" }}
                onClick={() => {
                  addCustomEvent();
                }}
              >
                {l10n("SIDEBAR_CREATE_CUSTOM_EVENT")}
              </Button>
            </div>
          </div>
        </SidebarColumn>
      </Sidebar>
    );
  }
}

WorldEditor.propTypes = {
  project: ProjectShape.isRequired,
  editProject: PropTypes.func.isRequired,
  editProjectSettings: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired,
  addCustomEvent: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const project = state.entities.present.result;
  return {
    project
  };
}

const mapDispatchToProps = {
  selectSidebar: actions.selectSidebar,
  editProject: actions.editProject,
  editProjectSettings: actions.editProjectSettings,
  addCustomEvent: actions.addCustomEvent
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorldEditor);
