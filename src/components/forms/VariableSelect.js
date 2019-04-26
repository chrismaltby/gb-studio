import React, { Component } from "react";
import { connect } from "react-redux";
import { SelectRenamable } from "../library/Forms";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";

const variables = Array.from(Array(512).keys()).map(n =>
  String(n).padStart(3, "0")
);

class VariableSelect extends Component {
  onRename = name => {
    this.props.renameVariable(this.props.value || "0", name);
  };

  variableName = index => {
    const { variableNames } = this.props;
    return variableNames[index]
      ? variableNames[index]
      : "Variable " + String(index).padStart(3, "0");
  };

  render() {
    const { dispatch, renameVariable, variableNames, ...rest } = this.props;
    return (
      <SelectRenamable
        editPlaceholder={l10n("FIELD_VARIABLE_NAME")}
        editDefaultValue={this.variableName(this.props.value || "0")}
        onRename={this.onRename}
        {...rest}
      >
        {variables.map((variable, index) => (
          <option key={index} value={index}>
            {this.variableName(index)}
          </option>
        ))}
      </SelectRenamable>
    );
  }
}

function mapStateToProps(state) {
  return {
    variableNames: state.project.present.variables
      ? state.project.present.variables.reduce((memo, variable) => {
          return {
            ...memo,
            [variable.id]: variable.name
          };
        }, {})
      : {}
  };
}

const mapDispatchToProps = {
  renameVariable: actions.renameVariable
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VariableSelect);
