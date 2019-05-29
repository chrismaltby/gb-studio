import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import TriggerEditor from "./TriggerEditor";
import ActorEditor from "./ActorEditor";
import SceneEditor from "./SceneEditor";
import WorldEditor from "./WorldEditor";

class EditorSidebar extends Component {
  render() {
    const { type, entityId, sceneId } = this.props;
    if (type === "triggers") {
      return <TriggerEditor key={entityId} id={entityId} sceneId={sceneId} />;
    }
    if (type === "actors") {
      return <ActorEditor key={entityId} id={entityId} sceneId={sceneId} />;
    }
    if (type === "scenes") {
      return <SceneEditor key={sceneId} id={sceneId} />;
    }
    if (type === "world") {
      return <WorldEditor />;
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
