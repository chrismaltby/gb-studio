import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import TriggerEditor from "./TriggerEditor";
import ActorEditor from "./ActorEditor";
import SceneEditor from "./SceneEditor";
import WorldEditor from "./WorldEditor";

class EditorSidebar extends Component {
  render() {
    const { editor } = this.props;
    const editorForm =
      editor.type === "triggers" ? (
        <TriggerEditor
          key={editor.index}
          id={editor.index}
          scene={editor.scene}
        />
      ) : editor.type === "actors" ? (
        <ActorEditor
          key={editor.index}
          id={editor.index}
          scene={editor.scene}
        />
      ) : editor.type === "scenes" ? (
        <SceneEditor key={editor.scene} id={editor.scene} />
      ) : editor.type === "world" ? (
        <WorldEditor />
      ) : null;
    return (
      <div
        className={cx("EditorSidebar", {
          "EditorSidebar--Open": !!editorForm
        })}
      >
        {editorForm}
      </div>
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
