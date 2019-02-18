import React, { Component } from "react";
import { connect } from "react-redux";

class SceneSelect extends Component {
  render() {
    const { maps, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        <option>None</option>
        {maps.map(map => (
          <option key={map.id} value={map.id}>
            {map.name}
          </option>
        ))}
      </select>
    );
  }
}

function mapStateToProps(state) {
  return {
    maps: (state.project && state.project.scenes) || []
  };
}

export default connect(mapStateToProps)(SceneSelect);
