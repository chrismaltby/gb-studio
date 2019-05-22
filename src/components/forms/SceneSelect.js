import React, { Component } from "react";
import { connect } from "react-redux";

class SceneSelect extends Component {
  render() {
    const { allowNone, maps, dispatch, ...rest } = this.props;
    const current = maps.find(m => m.id === rest.value);
    return (
      <select {...rest}>
        {!current && !allowNone && <option value="" />}
        {allowNone && <option>None</option>}
        {maps.map((map, index) => (
          <option key={map.id} value={map.id}>
            {map.name || `Scene ${index + 1}`}
          </option>
        ))}
      </select>
    );
  }
}

function mapStateToProps(state) {
  return {
    maps: (state.project.present && state.project.present.scenes) || []
  };
}

export default connect(mapStateToProps)(SceneSelect);
