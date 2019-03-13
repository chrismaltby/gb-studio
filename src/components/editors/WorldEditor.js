import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import SceneSelect from "../forms/SceneSelect";
import DirectionPicker from "../forms/DirectionPicker";
import SpriteSheetSelect from "../forms/SpriteSheetSelect";
import { FormField } from "../library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import SidebarHeading from "./SidebarHeading";

class WorldEditor extends Component {
  onEdit = key => e => {
    this.props.editProjectSettings({
      [key]: castEventValue(e)
    });
  };

  render() {
    const { project, settings } = this.props;

    if (!project || !project.scenes) {
      return <div />;
    }

    return (
      <div className="WorldEditor">
        <SidebarHeading title="Settings" />

        <div>
          <FormField>
            <label>
              <input
                type="checkbox"
                className="Checkbox"
                checked={settings.showCollisions}
                onChange={this.onEdit("showCollisions")}
              />
              <div className="FormCheckbox" />
              Show Collisions
            </label>
          </FormField>

          <FormField>
            <label>
              <input
                type="checkbox"
                className="Checkbox"
                checked={settings.showConnections}
                onChange={this.onEdit("showConnections")}
              />
              <div className="FormCheckbox" />
              Show Connections
            </label>
          </FormField>
        </div>

        <SidebarHeading title="Starting Scene" />

        <FormField>
          <label>
            <div className="Select">
              <SceneSelect
                value={settings.startSceneId || ""}
                onChange={this.onEdit("startSceneId")}
              />
            </div>
          </label>
        </FormField>

        <FormField>
          <label htmlFor="playerSprite">Player Sprite Sheet</label>
          <SpriteSheetSelect
            id="playerSprite"
            value={settings.playerSpriteSheetId}
            onChange={this.onEdit("playerSpriteSheetId")}
          />
        </FormField>

        <FormField halfWidth>
          <label htmlFor="startX">X</label>
          <input
            id="startX"
            type="number"
            value={settings.startX}
            min={0}
            max={31}
            placeholder={0}
            onChange={this.onEdit("startX")}
          />
        </FormField>

        <FormField halfWidth>
          <label htmlFor="startY">Y</label>
          <input
            id="startY"
            type="number"
            value={settings.startY}
            min={0}
            max={31}
            placeholder={0}
            onChange={this.onEdit("startY")}
          />
        </FormField>

        <FormField>
          <label htmlFor="startDirection">Direction</label>
          <DirectionPicker
            id="startDirection"
            value={settings.startDirection || 0}
            onChange={this.onEdit("startDirection")}
          />
        </FormField>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    project: state.project.present,
    settings: (state.project.present && state.project.present.settings) || {}
  };
}

const mapDispatchToProps = {
  editProjectSettings: actions.editProjectSettings
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorldEditor);
