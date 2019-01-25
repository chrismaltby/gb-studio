import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../actions";
import MapSelect from "./MapSelect";
import DirectionPicker from "./DirectionPicker";

class WorldEditor extends Component {
  onEdit = key => e => {
    const value = e.currentTarget
      ? e.currentTarget.type === "number"
        ? parseInt(e.currentTarget.value, 10)
        : e.currentTarget.type === "checkbox"
        ? e.currentTarget.checked
        : e.currentTarget.value
      : e;
    this.props.editProject({
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

        <label>
          <input
            type="checkbox"
            className="Checkbox"
            checked={settings.showCollisions}
            onChange={this.onEdit("showCollisions")}
          />
          Show Collisions
        </label>

        <label>
          <input
            type="checkbox"
            className="Checkbox"
            checked={settings.showConnections}
            onChange={this.onEdit("showConnections")}
          />
          Show Connections
        </label>

        <h2>Start Map</h2>

        <label>
          <div className="Select">
            <MapSelect
              value={project.startMapId}
              onChange={this.onEdit("startMapId")}
            />
          </div>
        </label>
        <label className="HalfWidth">
          X
          <input
            type="number"
            value={project.startX}
            min={1}
            onChange={this.onEdit("startX")}
          />
        </label>

        <label className="HalfWidth">
          Y
          <input
            type="number"
            value={project.startY}
            min={1}
            onChange={this.onEdit("startY")}
          />
        </label>

        <label>
          <DirectionPicker
            value={project.startDirection}
            onChange={this.onEdit("startDirection")}
          />
        </label>
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
  editProject: actions.editProject
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorldEditor);
