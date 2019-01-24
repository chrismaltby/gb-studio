import React, { Component } from "react";
import { connect } from "react-redux";

const flags = Array.from(Array(512).keys()).map(n =>
  String(n).padStart(3, "0")
);

class FlagSelect extends Component {
  render() {
    const { flagNames, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        {flags.map((flag, index) =>
          <option key={index} value={index}>
            {flagNames[index] ? flagNames[index] : "Flag " + flag}
          </option>
        )}
      </select>
    );
  }
}

function mapStateToProps(state) {
  return {
    flagNames: state.world.flags
      ? state.world.flags.reduce((memo, flag) => {
          return {
            ...memo,
            [flag.id]: flag.name
          };
        }, {})
      : {}
  };
}

export default connect(mapStateToProps)(FlagSelect);
