import React, { Component } from "react";
import { connect } from "react-redux";
import { SelectRenamable } from "../../components/library/Forms";
import * as actions from "../../actions";

const flags = Array.from(Array(512).keys()).map(n =>
  String(n).padStart(3, "0")
);

class FlagSelect extends Component {
  onRename = name => {
    this.props.renameFlag(this.props.value, name);
  };

  flagName = index => {
    const { flagNames } = this.props;
    return flagNames[index]
      ? flagNames[index]
      : "Flag " + String(index).padStart(3, "0");
  };

  render() {
    const { dispatch, renameFlag, flagNames, ...rest } = this.props;
    return (
      <SelectRenamable
        editPlaceholder="Flag Name"
        editDefaultValue={this.flagName(this.props.value)}
        onRename={this.onRename}
        {...rest}
      >
        {flags.map((flag, index) => (
          <option key={index} value={index}>
            {this.flagName(index)}
          </option>
        ))}
      </SelectRenamable>
    );
  }
}

function mapStateToProps(state) {
  return {
    flagNames: state.project.present.flags
      ? state.project.present.flags.reduce((memo, flag) => {
        return {
          ...memo,
          [flag.id]: flag.name
        };
      }, {})
      : {}
  };
}

const mapDispatchToProps = {
  renameFlag: actions.renameFlag
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlagSelect);
