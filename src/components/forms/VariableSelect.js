import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ProcedureVariableSelect from "./ProcedureVariableSelect";
import GlobalVariableSelect from "./GlobalVariableSelect";

class VariableSelect extends Component {
  render() {
    const { scope } = this.props;

    if (scope === "procedure") {
      return (
        <ProcedureVariableSelect {...this.props} />
      )
    } 
      return (
        <GlobalVariableSelect {...this.props} />
      )
    ;
  }
}

VariableSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  scope: PropTypes.string.isRequired
};

VariableSelect.defaultProps = {
  id: undefined,
  value: "0"
};

function mapStateToProps(state) {
  if (state.editor.type === "procedures") {
    return {
      scope: "procedure"
    };
  } 
  return {
    scope: "global"
  };
  
}

export default connect(
  mapStateToProps
)(VariableSelect);
