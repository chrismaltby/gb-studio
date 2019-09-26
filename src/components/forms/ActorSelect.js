import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import ProcedureActorSelect from "./ProcedureActorSelect";
import SceneActorSelect from "./SceneActorSelect";

class ActorSelect extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("ActorSelect", this.props, {}, nextProps, {});
    return true;
  }

  render() {
    const { scope } = this.props;
    if (scope === "procedure") {
      return (
        <ProcedureActorSelect {...this.props} />
      )
    } 
      return (
        <SceneActorSelect {...this.props} />
      )
  }
}

ActorSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number,
  scope: PropTypes.string.isRequired
};

ActorSelect.defaultProps = {
  id: "",
  value: "",
  frame: undefined,
  direction: undefined,
};

function mapStateToProps(state) {
  if (state.editor.type === "procedures") {
    return {
      scope: "procedure"
    }
  }
  return {
    scope: "scene"
  };
}

export default connect(mapStateToProps)(ActorSelect);
