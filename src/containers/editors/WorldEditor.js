import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import SceneSelect from "../forms/SceneSelect";
import DirectionPicker from "../../components/DirectionPicker";
import { FormField } from "../../components/library/Forms";

class WorldEditor extends Component {
  onEdit = key => e => {
    const value = e.currentTarget
      ? e.currentTarget.type === "number"
        ? parseInt(e.currentTarget.value, 10)
        : e.currentTarget.type === "checkbox"
          ? e.currentTarget.checked
          : e.currentTarget.value
      : e;
    this.props.editProjectSettings({
      [key]: value
    });
  };

  render() {
    const { project, settings } = this.props;

    if (!project) {
      return <div />;
    }

    return (
      <div className="WorldEditor">
        <h2>Settings</h2>

        <div>
          <FormField>
            <label>
              <input
                type="checkbox"
                className="Checkbox"
                checked={settings.showCollisions}
                onChange={this.onEdit("showCollisions")}
              />
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
              Show Connections
            </label>
          </FormField>
        </div>

        <h2>Starting Scene</h2>

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

        <FormField halfWidth>
          <label htmlFor="startX">X</label>
          <input
            id="startX"
            type="number"
            value={settings.startX || 0}
            min={1}
            onChange={this.onEdit("startX")}
          />
        </FormField>

        <FormField halfWidth>
          <label htmlFor="startY">Y</label>
          <input
            id="startY"
            type="number"
            value={settings.startY || 0}
            min={1}
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
    project: state.project,
    settings: (state.project && state.project.settings) || {}
  };
}

const mapDispatchToProps = {
  editProjectSettings: actions.editProjectSettings
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorldEditor);
