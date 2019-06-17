import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Scene from "./Scene";
import WorldHelp from "./WorldHelp";
import Connections from "./Connections";
import * as actions from "../../actions";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import {
  getMaxSceneRight,
  getMaxSceneBottom
} from "../../reducers/entitiesReducer";

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
    // window.addEventListener("copy", this.onCopy);
    // window.addEventListener("paste", this.onPaste);
    window.addEventListener("keydown", this.onKeyDown);
    // window.addEventListener("click", this.onClick);
    window.addEventListener("mouseup", this.onMouseUp);
    // window.addEventListener("mousewheel", this.onMouseWheel);

    const viewContents = this.scrollContentsRef.current;
    // Set zoom ratio on component mount incase it wasn't at 100%
    if (viewContents) {
      const { zoomRatio } = this.props;
      viewContents.style.transform = `scale(${zoomRatio})`;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("World", this.props, this.state, nextProps, nextState);
    return true;
  }

  componentDidUpdate(prevProps) {
    console.log("DID UPDATE", prevProps, this.props);
    const { zoomRatio } = this.props;
    if (zoomRatio !== prevProps.zoomRatio) {
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
      const zoomChange = zoomRatio / prevProps.zoomRatio;
      const newCenterX = oldCenterX * zoomChange;
      const newCenterY = oldCenterY * zoomChange;
      const newScrollX = newCenterX - offsetX;
      const newScrollY = newCenterY - offsetY;
      viewContents.style.transform = `scale(${zoomRatio})`;
      view.scroll({
        top: newScrollY,
        left: newScrollX
      });
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

  onCopy = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    e.preventDefault();

    // !!!!!!!!!!!!!!!
    // action.copySelectedEntity();
    // !!!!!!!!!!!!!!!

    /*
    const {
      editorType,
      entityId,
      scene,
      copyScene,
      copyTrigger,
      copyActor
    } = this.props;
    if (editorType === "scenes") {
      copyScene(scene);
    } else if (editorType === "triggers") {
      const trigger = scene.triggers.find(t => t.id === entityId);
      copyTrigger(trigger);
    } else if (editorType === "actors") {
      const actor = scene.actors.find(a => a.id === entityId);
      copyActor(actor);
    }*/
  };

  onPaste = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    e.preventDefault();

    // !!!!!!!!!!!!!!!
    // action.pasteEntity();
    // !!!!!!!!!!!!!!!

    // const {
    //   clipboardType,
    //   sceneId,
    //   pasteActor,
    //   pasteTrigger,
    //   pasteScene
    // } = this.props;

    /*
    if (clipboardType === "actor") {
      const { clipboardActor } = this.props;
      if (sceneId) {
        pasteActor(sceneId, clipboardActor);
      }
    } else if (clipboardType === "trigger") {
      const { clipboardTrigger } = this.props;
      if (sceneId) {
        pasteTrigger(sceneId, clipboardTrigger);
      }
    } else if (clipboardType === "scene") {
      const { clipboardScene } = this.props;
      pasteScene(clipboardScene);
    }
    */
  };

  onKeyDown = e => {
    console.log("KEYDOWN a");
    if (e.target.nodeName !== "BODY") {
      return;
    }
    console.log("KEYDOWN b");

    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    console.log("KEYDOWN c");
    const { removeSelectedEntity } = this.props;
    console.log("KEYDOWN d");

    // const { focused } = this.state;
    console.log("KEYDOWN e");
    if (e.key === "Backspace") {
      console.log("KEYDOWN f");

      removeSelectedEntity();
    }
    console.log("KEYDOWN g");
  };

  onClick = e => {
    // If clicked on child of world then it is focused
    // this.setState({
    //   focused: this.scrollRef.current.contains(e.target)
    // });
  };

  onMouseUp = e => {
    const {
      dragging,
      dragPlayerStop,
      dragDestinationStop,
      dragActorStop,
      dragTriggerStop
    } = this.props;
    // if (dragging === DRAG_PLAYER) {
    //   dragPlayerStop();
    // } else if (dragging === DRAG_DESTINATION) {
    //   dragDestinationStop();
    // } else if (dragging === DRAG_ACTOR) {
    //   dragActorStop();
    // } else if (dragging === DRAG_TRIGGER) {
    //   dragTriggerStop();
    // }
    this.worldDragging = false;
  };

  onMouseMove = e => {
    const { tool } = this.props;
    if (this.worldDragging) {
      e.currentTarget.scrollLeft -= e.movementX;
      e.currentTarget.scrollTop -= e.movementY;
    } else {
      const boundingRect = e.currentTarget.getBoundingClientRect();
      const x = e.pageX + e.currentTarget.scrollLeft - 0;
      const y = e.pageY + e.currentTarget.scrollTop - boundingRect.y - 0;

      this.offsetX = e.pageX;
      this.offsetY = e.pageY - boundingRect.y;

      if (tool === "scene") {
        const { zoomRatio } = this.props;
        this.setState({
          hover: true,
          hoverX: x / zoomRatio - 128,
          hoverY: y / zoomRatio - 128
        });
      }
    }
  };

  onMouseWheel = e => {
    const { zoomIn, zoomOut } = this.props;
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.wheelDelta > 0) {
        zoomIn("world", e.deltaY * 0.5);
      } else {
        zoomOut("world", e.deltaY * 0.5);
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
      const { dragPlayerStart } = this.props;
      dragPlayerStart(e);
    }
  };

  dragDestinationStart = (eventId, sceneId, type, entityIndex) => {
    // if (!this.worldDragging) {
    //   const { dragDestinationStart } = this.props;
    //   dragDestinationStart(eventId, sceneId, type, entityIndex);
    // }
  };

  onMouseEnter = e => {
    this.mouseOver = true;
  };

  onMouseLeave = e => {
    this.mouseOver = false;
  };

  onAddScene = e => {
    const { addScene, setTool, prefab } = this.props;
    const { hoverX, hoverY } = this.state;
    addScene(hoverX, hoverY, prefab);
    setTool("select");
  };

  render() {
    const {
      scenes,
      scrollWidth,
      scrollHeight,
      tool,
      showConnections,
      zoomRatio,
      sidebarWidth,
      selectWorld,
      loaded
    } = this.props;
    const { hover, hoverX, hoverY } = this.state;

    console.log("render: World");

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
            style={{ width: scrollWidth, height: scrollHeight }}
            onClick={selectWorld}
            onMouseDown={this.startWorldDrag}
          />

          {loaded && scenes.length === 0 && <WorldHelp />}

          {scenes.map((sceneId, index) => (
            <Scene key={sceneId} id={sceneId} index={index} />
          ))}

          {showConnections && (
            <Connections
              width={scrollWidth}
              height={scrollHeight}
              zoomRatio={zoomRatio}
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

World.propTypes = {
  scrollWidth: PropTypes.number.isRequired,
  scrollHeight: PropTypes.number.isRequired,

  // editorType: PropTypes.string,
  // entityId: PropTypes.string,
  // sceneId: PropTypes.string,
  scenes: PropTypes.arrayOf(PropTypes.string).isRequired,
  // scene: SceneShape,
  // settings: SettingsShape.isRequired,
  zoomRatio: PropTypes.number.isRequired,
  // clipboardType: PropTypes.string,
  // clipboardActor: ActorShape,
  // clipboardTrigger: TriggerShape,
  // clipboardScene: SceneShape,
  prefab: PropTypes.shape({}),
  sidebarWidth: PropTypes.number.isRequired,
  showConnections: PropTypes.bool.isRequired,
  tool: PropTypes.string.isRequired,
  // dragging: PropTypes.string.isRequired,
  addScene: PropTypes.func.isRequired,
  setTool: PropTypes.func.isRequired,
  selectWorld: PropTypes.func.isRequired,
  // removeScene: PropTypes.func.isRequired,
  // removeTrigger: PropTypes.func.isRequired,
  // removeActor: PropTypes.func.isRequired,
  dragPlayerStart: PropTypes.func.isRequired,
  dragPlayerStop: PropTypes.func.isRequired,
  // dragDestinationStart: PropTypes.func.isRequired,
  dragDestinationStop: PropTypes.func.isRequired,
  dragActorStop: PropTypes.func.isRequired,
  dragTriggerStop: PropTypes.func.isRequired,
  // copyScene: PropTypes.func.isRequired,
  // copyActor: PropTypes.func.isRequired,
  // copyTrigger: PropTypes.func.isRequired,
  // pasteScene: PropTypes.func.isRequired,
  // pasteActor: PropTypes.func.isRequired,
  // pasteTrigger: PropTypes.func.isRequired,
  zoomIn: PropTypes.func.isRequired,
  zoomOut: PropTypes.func.isRequired,
  loaded: PropTypes.bool.isRequired
};

World.defaultProps = {
  prefab: null
};

function mapStateToProps(state) {
  const loaded = state.document.loaded;
  const scenes = state.entities.present.result.scenes;
  const {
    sidebarWidth,
    showConnections
  } = state.entities.present.result.settings;

  const viewportWidth = window.innerWidth - sidebarWidth - 17;
  const viewportHeight = window.innerHeight - 40 - 17;

  const scrollWidth = Math.max(viewportWidth, getMaxSceneRight(state) + 20);
  const scrollHeight = Math.max(viewportHeight, getMaxSceneBottom(state) + 60);

  return {
    scenes,
    scrollWidth,
    scrollHeight,
    tool: state.tools.selected,
    prefab: state.tools.prefab,
    zoomRatio: (state.editor.zoom || 100) / 100,
    showConnections,
    sidebarWidth,
    loaded
  };
}

const mapDispatchToProps = {
  addScene: actions.addScene,
  setTool: actions.setTool,
  selectWorld: actions.selectWorld,
  removeSelectedEntity: actions.removeSelectedEntity,
  dragPlayerStart: actions.dragPlayerStart,
  dragPlayerStop: actions.dragPlayerStop,
  dragDestinationStart: actions.dragDestinationStart,
  dragDestinationStop: actions.dragDestinationStop,
  dragActorStop: actions.dragActorStop,
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
