import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { SelectRenamable } from "../library/Forms";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";

const variables = Array.from(Array(512).keys()).map(n =>
  String(n).padStart(3, "0")
);

class VariableSelect extends Component {
  onRename = name => {
    const { renameVariable, value } = this.props;
    renameVariable(value || "0", name);
  };

  variableName = index => {
    const { variableNames } = this.props;
    return variableNames[index]
      ? variableNames[index]
      : `Variable ${String(index).padStart(3, "0")}`;
  };

  render() {
    const { id, value, onChange } = this.props;
    return (
      <SelectRenamable
        editPlaceholder={l10n("FIELD_VARIABLE_NAME")}
        editDefaultValue={this.variableName(value || "0")}
        onRename={this.onRename}
        id={id}
        value={value}
        onChange={onChange}
      >
        {variables.map((variable, index) => (
          <option key={variable} value={index}>
            {index < 100 && `$${String(index).padStart(2, "0")}$ : `}
            {this.variableName(index)}
          </option>
        ))}
      </SelectRenamable>
    );
  }
}

VariableSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  variableNames: PropTypes.shape({}).isRequired,
  renameVariable: PropTypes.func.isRequired
};

VariableSelect.defaultProps = {
  id: undefined,
  value: "0"
};

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
