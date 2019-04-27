import React, { Component } from "react";
import { connect } from "react-redux";
import Scene from "./Scene";
import WorldHelp from "./WorldHelp";
import Connections from "./Connections";
import * as actions from "../../actions";

const MIDDLE_MOUSE = 2;

class World extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      hoverX: 0,
      hoverY: 0,
      focused: false
    };
    this.worldDragging = false;
    this.scrollRef = React.createRef();
    this.scrollContentsRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("click", this.onClick);
    window.addEventListener("mouseup", this.onMouseUp);

    const viewContents = this.scrollContentsRef.current;
    // Set zoom ratio on component mount incase it wasn't at 100%
    if (viewContents) {
      viewContents.style.transform = `scale(${this.props.zoomRatio})`;
    }
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("click", this.onClick);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  componentDidUpdate(prevProps) {
    if (this.props.zoomRatio !== prevProps.zoomRatio) {
      const view = this.scrollRef.current;
      const viewContents = this.scrollContentsRef.current;
      const oldScrollX = view.scrollLeft;
      const oldScrollY = view.scrollTop;
      const halfViewWidth = 0.5 * view.clientWidth;
      const halfViewHeight = 0.5 * view.clientHeight;
      const offsetX = this.mouseOver ? this.offsetX : halfViewWidth;
      const offsetY = this.mouseOver ? this.offsetY : halfViewHeight;
      const oldCenterX = oldScrollX + offsetX;
      const oldCenterY = oldScrollY + offsetY;
      const zoomChange = this.props.zoomRatio / prevProps.zoomRatio;
      const newCenterX = oldCenterX * zoomChange;
      const newCenterY = oldCenterY * zoomChange;
      const newScrollX = newCenterX - offsetX;
      const newScrollY = newCenterY - offsetY;
      viewContents.style.transform = `scale(${this.props.zoomRatio})`;
      view.scroll({
        top: newScrollY,
        left: newScrollX
      });
    }
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
      focused: this.scrollRef.current.contains(e.target)
    });
  };

  onMouseUp = e => {
    if (this.props.playerDragging) {
      this.props.dragPlayerStop();
    }
    if (this.props.destinationDragging) {
      this.props.dragDestinationStop();
    }
    this.worldDragging = false;
  };

  onMouseMove = e => {
    if (this.worldDragging) {
      e.currentTarget.scrollLeft -= e.movementX;
      e.currentTarget.scrollTop -= e.movementY;
    } else {
      const { zoomRatio } = this.props;
      const boundingRect = e.currentTarget.getBoundingClientRect();
      const x = e.pageX + e.currentTarget.scrollLeft - 0;
      const y = e.pageY + e.currentTarget.scrollTop - boundingRect.y - 0;

      this.offsetX = e.pageX;
      this.offsetY = e.pageY - boundingRect.y;

      this.setState({
        hover: true,
        hoverX: x / zoomRatio - 128,
        hoverY: y / zoomRatio - 128
      });
    }
  };

  startWorldDrag = e => {
    this.worldDragging = true;
  };

  startWorldDragIfAltOrMiddleClick = e => {
    if (e.altKey || e.nativeEvent.which === MIDDLE_MOUSE) {
      this.worldDragging = true;
      e.stopPropagation();
    }
  };

  dragPlayerStart = e => {
    if (!this.worldDragging) {
      this.props.dragPlayerStart(e);
    }
  };

  dragDestinationStart = (eventId, sceneId, type, entityIndex) => {
    if (!this.worldDragging) {
      this.props.dragDestinationStart(eventId, sceneId, type, entityIndex);
    }
  };

  onMouseEnter = e => {
    this.mouseOver = true;
  };

  onMouseLeave = e => {
    this.mouseOver = false;
  };

  onAddScene = e => {
    const { hoverX, hoverY } = this.state;
    this.props.addScene(hoverX, hoverY);
    this.props.setTool("select");
  };

  render() {
    const {
      scenes,
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

    const width = Math.max(
      window.innerWidth - 300,
      scenes && scenes.length > 0
        ? Math.max.apply(null, scenes.map(scene => scene.x + scene.width * 8)) +
            20
        : 100
    );
    const height = Math.max(
      window.innerHeight,
      scenes && scenes.length > 0
        ? Math.max.apply(
            null,
            scenes.map(scene => 20 + scene.y + scene.height * 8)
          ) + 20
        : 100
    );

    return (
      <div
        ref={this.scrollRef}
        className="World"
        onMouseMove={this.onMouseMove}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onMouseDown={this.startWorldDragIfAltOrMiddleClick}
      >
        <div ref={this.scrollContentsRef} className="World__Content">
          <div
            className="World__Grid"
            style={{ width, height }}
            onClick={this.props.selectWorld}
            onMouseDown={this.startWorldDrag}
          />

          {scenes && scenes.length === 0 && <WorldHelp />}

          {scenes &&
            scenes.map((scene, index) => (
              <div key={scene.id}>
                <Scene id={scene.id} index={index} scene={scene} />
              </div>
            ))}

          {scenes && showConnections && (
            <Connections
              width={width}
              height={height}
              scenes={scenes}
              settings={settings}
              zoomRatio={zoomRatio}
              dragScene={sceneDragging ? dragScene : ""}
              dragX={dragX}
              dragY={dragY}
              onDragPlayerStart={this.dragPlayerStart}
              onDragDestinationStart={this.dragDestinationStart}
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
      state.project.present.settings.showConnections,
    playerDragging: state.editor.playerDragging,
    destinationDragging: state.editor.destinationDragging
  };
}

const mapDispatchToProps = {
  addScene: actions.addScene,
  setTool: actions.setTool,
  selectWorld: actions.selectWorld,
  removeScene: actions.removeScene,
  removeTrigger: actions.removeTrigger,
  removeActor: actions.removeActor,
  dragPlayerStart: actions.dragPlayerStart,
  dragPlayerStop: actions.dragPlayerStop,
  dragDestinationStart: actions.dragDestinationStart,
  dragDestinationStop: actions.dragDestinationStop
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(World);
