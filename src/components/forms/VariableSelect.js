import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { SelectRenamable } from "../library/Forms";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import { VariableShape } from "../../reducers/stateShape";

const allVariables = Array.from(Array(512).keys()).map(n =>
  String(n).padStart(3, "0")
);

class VariableSelect extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("VariableSelect", this.props, {}, nextProps, {});
    return true;
  }

  onRename = name => {
    const { renameVariable, value } = this.props;
    renameVariable(value || "0", name);
  };

  variableName = index => {
    const { variables } = this.props;
    return variables[index]
      ? variables[index].name
      : `Variable ${String(index).padStart(3, "0")}`;
  };

  variableLabel = index => {
    const ptr = index < 100 ? `$${String(index).padStart(2, "0")}$ : ` : ``;
    return `${ptr}${this.variableName(index)}`;
  };

  render() {
    const { id, value, onChange } = this.props;

    const options = allVariables.map((variable, index) => {
      return {
        value: String(index),
        label: this.variableName(index)
      };
    });

    return (
      <SelectRenamable
        editPlaceholder={l10n("FIELD_VARIABLE_NAME")}
        editDefaultValue={this.variableName(value || "0")}
        onRename={this.onRename}
        id={id}
        value={{
          value,
          label: this.variableLabel(value)
        }}
        onChange={onChange}
        options={options}
      />
    );
  }
}

VariableSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  variables: PropTypes.objectOf(VariableShape).isRequired,
  renameVariable: PropTypes.func.isRequired
};

VariableSelect.defaultProps = {
  id: undefined,
  value: "0"
};

function mapStateToProps(state) {
  const variables = state.entities.present.entities.variables;
  return {
    variables
  };
}

const mapDispatchToProps = {
  renameVariable: actions.renameVariable
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VariableSelect);
