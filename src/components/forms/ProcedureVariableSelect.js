import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select from "react-select";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import { VariableShape } from "../../reducers/stateShape";

const allVariables = Array.from(Array(10).keys());

class ProcedureVariableSelect extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("ProcedureVariableSelect", this.props, {}, nextProps, {});
    return true;
  }

  variableName = index => {
    const { variables } = this.props;
    const letter = String.fromCharCode('A'.charCodeAt(0) + index);
    return variables[index] ? variables[index].name : `Variable ${letter}`;
  };

  variableLabel = index => {
    const letter = String.fromCharCode('A'.charCodeAt(0) + parseInt(index));
    return `${letter} : ${this.variableName(index)}`;
  };

  render() {
    const { id, value, onChange } = this.props;

    const options = allVariables.map((variable, index) => {
      return {
        value: String(index),
        label: this.variableLabel(index)
      };
    });
    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
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

ProcedureVariableSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  variables: PropTypes.objectOf(VariableShape).isRequired,
};

ProcedureVariableSelect.defaultProps = {
  id: undefined,
  value: "0"
};

function mapStateToProps(state) {
  const entityId = state.editor.entityId;
  const variables = state.entities.present.entities.procedures[entityId].variables;
  return {
    variables
  };
}

export default connect(
  mapStateToProps
)(ProcedureVariableSelect);
