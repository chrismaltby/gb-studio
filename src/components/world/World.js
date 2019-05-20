import React, { Component } from "react";
import { connect } from "react-redux";
import Scene from "./Scene";
import WorldHelp from "./WorldHelp";
import Connections from "./Connections";
import * as actions from "../../actions";
import {
  DRAG_PLAYER,
  DRAG_DESTINATION,
  DRAG_ACTOR,
  DRAG_TRIGGER,
  SIDE
} from "../../reducers/editorReducer";

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
    window.addEventListener("copy", this.onCopy);
    window.addEventListener("paste", this.onPaste);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("click", this.onClick);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousewheel", this.onMouseWheel);

    const viewContents = this.scrollContentsRef.current;
    // Set zoom ratio on component mount incase it wasn't at 100%
    if (viewContents) {
      viewContents.style.transform = `scale(${this.props.zoomRatio})`;
    }
  }

  componentWillUnmount() {
    window.removeEventListener("copy", this.onCopy);
    window.removeEventListener("paste", this.onPaste);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("click", this.onClick);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousewheel", this.onMouseWheel);
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

  onCopy = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    e.preventDefault();
    const { editor, scenes } = this.props;
    if (editor.type === "scenes") {
      const scene = scenes.find(s => s.id === editor.scene);
      this.props.copyScene(scene);
    } else if (editor.type === "triggers") {
      const scene = scenes.find(s => s.id === editor.scene);
      const trigger = scene.triggers.find(t => t.id === editor.entityId);
      this.props.copyTrigger(trigger);
    } else if (editor.type === "actors") {
      const scene = scenes.find(s => s.id === editor.scene);
      const actor = scene.actors.find(a => a.id === editor.entityId);
      this.props.copyActor(actor);
    }
  };

  onPaste = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    e.preventDefault();
    const { clipboardType, editor } = this.props;
    if (clipboardType === "actor") {
      const { clipboardActor } = this.props;
      if (editor.scene) {
        this.props.pasteActor(editor.scene, clipboardActor);
      }
    } else if (clipboardType === "trigger") {
      const { clipboardTrigger } = this.props;
      if (editor.scene) {
        this.props.pasteTrigger(editor.scene, clipboardTrigger);
      }
    } else if (clipboardType === "scene") {
      const { clipboardScene } = this.props;
      this.props.pasteScene(clipboardScene);
    }
  };

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
        this.props.removeTrigger(editor.scene, editor.entityId);
      } else if (editor.type === "actors") {
        this.props.removeActor(editor.scene, editor.entityId);
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
    const { dragging } = this.props;
    if (dragging === DRAG_PLAYER) {
      this.props.dragPlayerStop();
    } else if (dragging === DRAG_DESTINATION) {
      this.props.dragDestinationStop();
    } else if (dragging === DRAG_ACTOR) {
      this.props.dragActorStop();
    } else if (dragging === DRAG_TRIGGER) {
      this.props.dragTriggerStop();
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

  onMouseWheel = e => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (event.wheelDelta > 0) {
        this.props.zoomIn("world", event.deltaY * 0.5);
      } else {
        this.props.zoomOut("world", event.deltaY * 0.5);
      }
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
      editor,
      sidebarWidth
    } = this.props;
    const { hover, hoverX, hoverY } = this.state;
    const {
      sceneDragging,
      scene: dragScene,
      sceneDragX: dragX,
      sceneDragY: dragY
    } = editor;

    const width = Math.max(
      window.innerWidth - sidebarWidth - 17,
      scenes && scenes.length > 0
        ? Math.max.apply(null, scenes.map(scene => scene.x + scene.width * 8)) +
            20
        : 100
    );
    const height = Math.max(
      window.innerHeight - 40 - 17,
      scenes && scenes.length > 0
        ? Math.max.apply(
            null,
            scenes.map(scene => 20 + scene.y + scene.height * 8)
          ) + 20
        : 100
    );

    const worldStyle = { right: sidebarWidth };

    return (
      <div
        ref={this.scrollRef}
        className="World"
        style={worldStyle}
        onMouseMove={this.onMouseMove}
        onMouseOver={this.onMouseEnter}
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
    dragging: state.editor.dragging,
    clipboardScene: state.clipboard.scene,
    clipboardActor: state.clipboard.actor,
    clipboardTrigger: state.clipboard.trigger,
    clipboardType: state.clipboard.last,
    sidebarWidth: state.project.present.settings.sidebarWidth
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
  dragDestinationStop: actions.dragDestinationStop,
  dragActorStart: actions.dragActorStart,
  dragActorStop: actions.dragActorStop,
  dragTriggerStart: actions.dragTriggerStart,
  dragTriggerStop: actions.dragTriggerStop,
  copyScene: actions.copyScene,
  copyActor: actions.copyActor,
  copyTrigger: actions.copyTrigger,
  pasteScene: actions.pasteScene,
  pasteActor: actions.pasteActor,
  pasteTrigger: actions.pasteTrigger,
  zoomIn: actions.zoomIn,
  zoomOut: actions.zoomOut
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(World);
