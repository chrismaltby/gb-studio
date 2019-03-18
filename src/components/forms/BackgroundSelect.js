import React, { Component } from "react";
import { connect } from "react-redux";

class BackgroundSelect extends Component {
  render() {
    const { backgrounds, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        {/* <option>None</option> */}
        {backgrounds.map(background => (
          <option key={background.id} value={background.id}>
            {background.name}
          </option>
        ))}
      </select>
    );
  }
}

function mapStateToProps(state) {
  return {
    backgrounds:
      (state.project.present && state.project.present.backgrounds) || []
  };
}

export default connect(mapStateToProps)(BackgroundSelect);
