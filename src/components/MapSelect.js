import React, { Component } from "react";
import { connect } from "react-redux";

class MapSelect extends Component {
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
    maps: (state.projects && state.projects.maps) || []
  };
}

export default connect(mapStateToProps)(MapSelect);
