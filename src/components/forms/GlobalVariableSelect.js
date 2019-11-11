import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { SelectRenamable } from "../library/Forms";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import { VariableShape } from "../../reducers/stateShape";

const allVariables = [].concat(
  Array.from(Array(512).keys()).map(n => String(n).padStart(3, "0"))
);

const localVariables = ["A", "B", "C", "D"];

class GlobalVariableSelect extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("GlobalVariableSelect", this.props, {}, nextProps, {});
    return true;
  }

  onRename = name => {
    const { renameVariable, value, entityId } = this.props;
    const valueIsLocal = localVariables.indexOf(value) > -1;
    if (valueIsLocal) {
      renameVariable(`${entityId}__${value}`, name);
    } else {
      renameVariable(value || "0", name);
    }
  };

  variableName = index => {
    const { variables } = this.props;
    return variables[index]
      ? variables[index].name
      : `Variable ${String(index).padStart(3, "0")}`;
  };

  localName = code => {
    const { variables, entityId } = this.props;
    return variables[`${entityId}__${code}`]
      ? variables[`${entityId}__${code}`].name
      : `Local ${code}`;
  };

  variableLabel = index => {
    const ptr = index < 100 ? `$${String(index).padStart(2, "0")}$ : ` : ``;
    return `${ptr}${this.variableName(index)}`;
  };

  render() {
    const { id, value, onChange } = this.props;

    const options = [].concat(
      localVariables.map((variable, index) => {
        return {
          value: variable,
          label: this.localName(variable)
        };
      }),
      allVariables.map((variable, index) => {
        return {
          value: String(index),
          label: this.variableLabel(index)
        };
      })
    );

    const valueIsLocal = localVariables.indexOf(value) > -1;

    return (
      <SelectRenamable
        editPlaceholder={l10n("FIELD_VARIABLE_NAME")}
        editDefaultValue={
          valueIsLocal
            ? this.localName(value)
            : this.variableLabel(value || "0")
        }
        onRename={this.onRename}
        id={id}
        value={{
          value,
          label: valueIsLocal
            ? this.localName(value)
            : this.variableLabel(value)
        }}
        onChange={onChange}
        options={options}
      />
    );
  }
}

GlobalVariableSelect.propTypes = {
  id: PropTypes.string,
  entityId: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  variables: PropTypes.objectOf(VariableShape).isRequired,
  renameVariable: PropTypes.func.isRequired
};

GlobalVariableSelect.defaultProps = {
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
)(GlobalVariableSelect);
