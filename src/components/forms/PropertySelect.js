import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import CustomEventPropertySelect from "./CustomEventPropertySelect";
import ScenePropertySelect from "./ScenePropertySelect";

class PropertySelect extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("PropertySelect", this.props, {}, nextProps, {});
    return true;
  }

  render() {
    const { scope } = this.props;
    if (scope === "customEvent") {
      return <CustomEventPropertySelect {...this.props} />;
    }
    return <ScenePropertySelect {...this.props} />;
  }
}

PropertySelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number,
  scope: PropTypes.string.isRequired
};

PropertySelect.defaultProps = {
  id: "",
  value: "",
  frame: undefined,
  direction: undefined
};

function mapStateToProps(state) {
  if (state.editor.type === "customEvents") {
    return {
      scope: "customEvent"
    };
  }
  return {
    scope: "scene"
  };
}

export default connect(mapStateToProps)(PropertySelect);
