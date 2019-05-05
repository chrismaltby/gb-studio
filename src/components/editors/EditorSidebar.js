import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import TriggerEditor from "./TriggerEditor";
import ActorEditor from "./ActorEditor";
import SceneEditor from "./SceneEditor";
import WorldEditor from "./WorldEditor";
import * as actions from "../../actions";

class EditorSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = { dragging: false };
    this.dragHandler = React.createRef();
    window.addEventListener('mousemove', this.onMouseMove);
  }

  onMouseDown = () => {
    this.setState({
      ...this.state,
      dragging: true
    });
  }

  onMouseUp = () => {
    this.setState({
      ...this.state,
      dragging: false
    });
  }

  onMouseMove = (event) => {
    if (this.state.dragging) {
      this.props.resizeSidebar(window.innerWidth - event.pageX);
    }
  }

  render() {
    const { editor } = this.props;
    const editorForm =
      editor.type === "triggers" ? (
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
      ) : null;
      const editorSidebarStyle = {
        width: editorForm ? editor.sidebarWidth : 0,
        right: editorForm ? 0 : -editor.sidebarWidth
      };
    return (
      <div className="EditorSidebarWrapper">
        <div
          ref={this.dragHandler}
          className="EditorSidebarDragHandle"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
        ></div>
        <div
          style={editorSidebarStyle}
          className={cx("EditorSidebar", {
            "EditorSidebar--Open": !!editorForm
          })}
        >
          {editorForm}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    editor: state.editor
  };
}

const mapDispatchToProps = {
  resizeSidebar: actions.resizeSidebar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorSidebar);
