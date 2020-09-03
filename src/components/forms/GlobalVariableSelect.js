import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { SelectRenamable } from "../library/Forms";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";
// import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import { VariableShape } from "../../reducers/stateShape";
import { TMP_VAR_1, TMP_VAR_2 } from "../../consts";
import { actions as enitityActions, variableSelectors } from "../../store/features/entities/entitiesSlice";

const allVariables = Array.from(Array(512).keys()).map(n =>
  String(n).padStart(3, "0")
);

const localVariables = ["L0", "L1", "L2", "L3", "L4", "L5"];
const tempVariables = [TMP_VAR_1, TMP_VAR_2];

class GlobalVariableSelect extends Component {
  // shouldComponentUpdate(nextProps, nextState) {
  //   rerenderCheck("GlobalVariableSelect", this.props, {}, nextProps, {});
  //   return true;
  // }

  onRename = name => {
    const { renameVariable, value, entityId } = this.props;
    const valueIsLocal = localVariables.indexOf(value) > -1;
    if (valueIsLocal) {
      renameVariable({variableId: `${entityId}__${value}`, name});
    } else {
      renameVariable({variableId: value || "0", name});
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
      : `Local ${code[1]}`;
  };

  tempName = code => {
    return `Temp ${code[1]}`;
  };  

  variableLabel = index => {
    const ptr = `$${String(index).padStart(2, "0")}$ : `;
    return `${ptr}${this.variableName(index)}`;
  };

  localLabel = index => {
    const ptr = `$${index}$ : `;
    return `${ptr}${this.localName(index)}`;
  };

  tempLabel = index => {
    const ptr = `$${index}$ : `;
    return `${ptr}${this.tempName(index)}`;
  };  

  render() {
    const { id, value, onChange, variablesVersion, allowRename } = this.props;

    const options = [
      {
        label: l10n("FIELD_LOCAL"),
        options: localVariables.map((variable, index) => {
          return {
            value: variable,
            label: this.localLabel(variable)
          };
        })
      },
      {
        label: l10n("FIELD_TEMPORARY"),
        options: tempVariables.map((variable, index) => {
          return {
            value: variable,
            label: this.tempLabel(variable)
          };
        })
      },      
      {
        label: l10n("FIELD_GLOBAL"),
        options: allVariables.map((variable, index) => {
          return {
            value: String(index),
            label: this.variableLabel(index)
          };
        })
      }
    ];

    const valueIsLocal = localVariables.indexOf(value) > -1;
    const valueIsTemp = tempVariables.indexOf(value) > -1;

    let label;
    if(valueIsLocal) {
      label = this.localLabel(value);
    } else if(valueIsTemp) {
      label = this.tempLabel(value);
    } else {
      label = this.variableLabel(value);
    }

    return (
      <SelectRenamable
        key={variablesVersion}
        editPlaceholder={l10n("FIELD_VARIABLE_NAME")}
        editDefaultValue={
          valueIsLocal ? this.localName(value) : this.variableName(value || "0")
        }
        onRename={this.onRename}
        id={id}
        value={{
          value,
          label
        }}
        onChange={onChange}
        options={options}
        allowRename={allowRename && !valueIsTemp}
        grouped
        menuPlacement="auto"
        blurInputOnSelect
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
  renameVariable: PropTypes.func.isRequired,
  variablesVersion: PropTypes.number.isRequired
};

GlobalVariableSelect.defaultProps = {
  id: undefined,
  value: "0"
};

function mapStateToProps(state) {
  const variables = variableSelectors.selectEntities(state);
  const variablesVersion = state.editor.variableVersion;
  return {
    variables,
    variablesVersion
  };
}

const mapDispatchToProps = {
  renameVariable: enitityActions.renameVariable
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GlobalVariableSelect);
