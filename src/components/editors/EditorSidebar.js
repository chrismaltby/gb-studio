import React, { Component } from "react";
import { connect } from "react-redux";
import TriggerEditor from "./TriggerEditor";
import ActorEditor from "./ActorEditor";
import SceneEditor from "./SceneEditor";
import WorldEditor from "./WorldEditor";

class EditorSidebar extends Component {
  render() {
    const { editor } = this.props;
    return editor.type === "triggers" ? (
      <TriggerEditor
        key={editor.entityId}
        id={editor.entityId}
        scene={editor.scene}
      />
    ) : editor.type === "actors" ? (
      <ActorEditor
        key={editor.entityId}
        id={editor.entityId}
        scene={editor.scene}
      />
    ) : editor.type === "scenes" ? (
      <SceneEditor key={editor.scene} id={editor.scene} />
    ) : editor.type === "world" ? (
      <WorldEditor />
    ) : (
      <div />
    );
  }
}

function mapStateToProps(state) {
  return {
    editor: state.editor
  };
}

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorSidebar);
