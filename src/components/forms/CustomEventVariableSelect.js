import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select from "react-select";
import { VariableShape } from "../../reducers/stateShape";
import { customEventSelectors } from "../../store/features/entities/entitiesSlice";

const menuPortalEl = document.getElementById("MenuPortal");

const allVariables = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

class CustomEventVariableSelect extends Component {
  variableName = index => {
    const { variables } = this.props;
    const letter = String.fromCharCode("A".charCodeAt(0) + parseInt(index, 10));
    return variables[index] ? variables[index].name : `Variable ${letter}`;
  };

  variableLabel = index => {
    return `$V${index}$ : ${this.variableName(index)}`;
  };

  render() {
    const { id, value, onChange } = this.props;
    const options = allVariables.map((variable, index) => {
      return {
        value: String(index),
        label: this.variableLabel(index)
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
  value: "0"
};

function mapStateToProps(state) {
  const entityId = state.editor.entityId;
  const customEvent = customEventSelectors.selectById(state, entityId);
  const variables = customEvent && customEvent.variables;
  return {
    variables
  };
}

export default connect(mapStateToProps)(CustomEventVariableSelect);
