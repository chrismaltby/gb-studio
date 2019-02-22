import React, { Component } from "react";
import { connect } from "react-redux";
import Scene from "./Scene";
import Connections from "./Connections";
import * as actions from "../../actions";

class World extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      hoverX: 0,
      hoverY: 0,
      focused: false
    };
    this.worldRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("click", this.onClick);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("click", this.onClick);
  }

  onKeyDown = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    if (e.key === "Backspace" && this.state.focused) {
      const editor = this.props.editor;
      if (editor.type === "scenes") {
        this.props.removeScene(editor.scene);
      } else if (editor.type === "triggers") {
        this.props.removeTrigger(editor.scene, editor.index);
      } else if (editor.type === "actors") {
        this.props.removeActor(editor.scene, editor.index);
      }
    }
  };

  onClick = e => {
    // If clicked on child of world then it is focused
    this.setState({
      focused: this.worldRef.current.contains(e.target)
    });
  };

  onMouseMove = e => {
    const { zoomRatio } = this.props;
    const boundingRect = e.currentTarget.getBoundingClientRect();
    const x = e.pageX + e.currentTarget.scrollLeft - 0;
    const y = e.pageY + e.currentTarget.scrollTop - boundingRect.y - 0;
    this.setState({
      hover: true,
      hoverX: x / zoomRatio - 128,
      hoverY: y / zoomRatio - 128
    });
  };

  onAddScene = e => {
    const { hoverX, hoverY } = this.state;
    this.props.addScene(hoverX, hoverY);
    this.props.setTool("select");
  };

  render() {
    const {
      scenes = [],
      settings,
      tool,
      showConnections,
      zoomRatio,
      editor
    } = this.props;
    const { hover, hoverX, hoverY } = this.state;
    const {
      sceneDragging,
      scene: dragScene,
      sceneDragX: dragX,
      sceneDragY: dragY
    } = editor;

    const scenesWidth =
      Math.max.apply(null, scenes.map(scene => scene.x + scene.width * 8)) +
      100;
    const scenesHeight =
      Math.max.apply(
        null,
        scenes.map(scene => 20 + scene.y + scene.height * 8)
      ) + 100;

    const width = Math.max((window.innerWidth - 300) / zoomRatio, scenesWidth);
    const height = Math.max(
      (window.innerHeight - 35) / zoomRatio,
      scenesHeight
    );

    return (
      <div ref={this.worldRef} className="World" onMouseMove={this.onMouseMove}>
        <div
          className="World__Content"
          style={{ transform: `scale(${zoomRatio})` }}
        >
          <div
            className="World__Grid"
            style={{ width, height }}
            onClick={this.props.selectWorld}
          />
          {scenes.map(scene => (
            <div key={scene.id}>
              <Scene id={scene.id} scene={scene} />
            </div>
          ))}
          {showConnections && (
            <Connections
              scenes={scenes}
              settings={settings}
              zoomRatio={zoomRatio}
              dragScene={sceneDragging ? dragScene : ""}
              dragX={dragX}
              dragY={dragY}
            />
          )}
          {tool === "scene" && hover && (
            <div
              className="World__NewScene"
              onClick={this.onAddScene}
              style={{
                left: hoverX,
                top: hoverY
              }}
            />
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    tool: state.tools.selected,
    scenes: state.project.present && state.project.present.scenes,
    settings: state.project.present.settings,
    editor: state.editor,
    zoomRatio: (state.editor.zoom || 100) / 100,
    showConnections:
      state.project.present.settings &&
      state.project.present.settings.showConnections
  };
}

const mapDispatchToProps = {
  addScene: actions.addScene,
  setTool: actions.setTool,
  selectWorld: actions.selectWorld,
  removeScene: actions.removeScene,
  removeTrigger: actions.removeTrigger,
  removeActor: actions.removeActor
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(World);
