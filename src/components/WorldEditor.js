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
    this.props.editWorld({
      [key]: value
    });
  };

  render() {
    const { world } = this.props;

    if (!world) {
      return <div />;
    }

    return (
      <div className="WorldEditor">
        <h2>Game</h2>

        <label>
          Game name
          <input value={world.name} onChange={this.onEdit("name")} />
        </label>

        <label>
          <input
            type="checkbox"
            className="Checkbox"
            checked={world.showCollisions}
            onChange={this.onEdit("showCollisions")}
          />
          Show Collisions
        </label>

        <label>
          <input
            type="checkbox"
            className="Checkbox"
            checked={world.showConnections}
            onChange={this.onEdit("showConnections")}
          />
          Show Connections
        </label>

        <h2>Start Map</h2>

        <label>
          <div className="Select">
            <MapSelect
              value={world.startMapId}
              onChange={this.onEdit("startMapId")}
            />
          </div>
        </label>
        <label className="HalfWidth">
          X
          <input
            type="number"
            value={world.startX}
            min={1}
            onChange={this.onEdit("startX")}
          />
        </label>

        <label className="HalfWidth">
          Y
          <input
            type="number"
            value={world.startY}
            min={1}
            onChange={this.onEdit("startY")}
          />
        </label>

        <label>
          <DirectionPicker
            value={world.startDirection}
            onChange={this.onEdit("startDirection")}
          />
        </label>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    world: state.world
  };
}

const mapDispatchToProps = {
  editWorld: actions.editWorld
};

export default connect(mapStateToProps, mapDispatchToProps)(WorldEditor);
