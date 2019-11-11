import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import CustomEventVariableSelect from "./CustomEventVariableSelect";
import GlobalVariableSelect from "./GlobalVariableSelect";

class VariableSelect extends Component {
  render() {
    const { scope } = this.props;

    if (scope === "customEvent") {
      return <CustomEventVariableSelect {...this.props} />;
    }
    return <GlobalVariableSelect {...this.props} />;
  }
}

VariableSelect.propTypes = {
  id: PropTypes.string,
  entityId: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  scope: PropTypes.string.isRequired
};

VariableSelect.defaultProps = {
  id: undefined,
  value: "0"
};

function mapStateToProps(state) {
  if (state.editor.type === "customEvents") {
    return {
      scope: "customEvent"
    };
  }
  return {
    scope: "global"
  };
}

export default connect(mapStateToProps)(VariableSelect);
