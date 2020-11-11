import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import TriggerEditor from "./TriggerEditor";
import { ActorEditor } from "./ActorEditor";
import SceneEditor from "./SceneEditor";
import WorldEditor from "./WorldEditor";
import CustomEventEditor from "./CustomEventEditor";
import { VariableEditor } from "./VariableEditor";

class EditorSidebar extends Component {
  render() {
    const { type, entityId, sceneId } = this.props;
    if (type === "trigger") {
      return <TriggerEditor key={entityId} id={entityId} sceneId={sceneId} />;
    }
    if (type === "actor") {
      return <ActorEditor key={entityId} id={entityId} sceneId={sceneId} />;
    }
    if (type === "scene") {
      return <SceneEditor key={sceneId} id={sceneId} />;
    }
    if (type === "world") {
      return <WorldEditor />;
    }
    if (type === "customEvent") {
      return <CustomEventEditor key="entityId" id={entityId} />;
    }
    if (type === "variable") {
      return <VariableEditor id={entityId} />;
    }
    return <div />;
  }
}

EditorSidebar.propTypes = {
  type: PropTypes.string,
  entityId: PropTypes.string,
  sceneId: PropTypes.string
};

EditorSidebar.defaultProps = {
  type: "",
  entityId: "",
  sceneId: ""
};

function mapStateToProps(state) {
  const { type, entityId, scene: sceneId } = state.editor;
  return { type, entityId, sceneId };
}

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorSidebar);
