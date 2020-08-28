import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select from "react-select";
import { VariableShape } from "../../reducers/stateShape";

const menuPortalEl = document.getElementById("MenuPortal");

const allVariables = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9"];

class CustomEventVariableSelect extends Component {
  variableName = variable => {
    const { variables } = this.props;
    const index = allVariables.findIndex(v => v === variable);
    const letter = String.fromCharCode("A".charCodeAt(0) + parseInt(index, 10));
    return variables[index] ? variables[index].name : `Variable ${letter}`;
  };

  variableLabel = variable => {
    return `$${variable}$ : ${this.variableName(variable)}`;
  };

  render() {
    const { id, value, onChange } = this.props;
    const options = allVariables.map((variable, index) => {
      return {
        value: variable,
        label: this.variableLabel(variable, index)
      };
    });
    let val = options.find((o) => o.value === value) || options[0];
    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        value={val}
        onChange={onChange}
        options={options}
        menuPlacement="auto"
        menuPortalTarget={menuPortalEl}
        blurInputOnSelect
      />
    );
  }
}

CustomEventVariableSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  variables: PropTypes.objectOf(VariableShape).isRequired
};

CustomEventVariableSelect.defaultProps = {
  id: undefined,
  value: "V0"
};

function mapStateToProps(state) {
  const entityId = state.editor.entityId;
  const variables =
    state.entities.present.entities.customEvents[entityId].variables;
  return {
    variables
  };
}

export default connect(mapStateToProps)(CustomEventVariableSelect);
