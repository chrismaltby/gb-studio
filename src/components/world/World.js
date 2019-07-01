import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import Scene from "./Scene";
import WorldHelp from "./WorldHelp";
import Connections from "./Connections";
import * as actions from "../../actions";
import {
  getMaxSceneRight,
  getMaxSceneBottom
} from "../../reducers/entitiesReducer";
import { MIDDLE_MOUSE } from "../../consts";

class World extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      hoverX: 0,
      hoverY: 0
    };
    this.worldDragging = false;
    this.scrollRef = React.createRef();
    this.scrollContentsRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("copy", this.onCopy);
    window.addEventListener("paste", this.onPaste);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousewheel", this.onMouseWheel);

    const viewContents = this.scrollContentsRef.current;
    // Set zoom ratio on component mount incase it wasn't at 100%
    if (viewContents) {
      const { zoomRatio } = this.props;
      viewContents.style.transform = `scale(${zoomRatio})`;
    }

    const { scrollX, scrollY } = this.props;
    const scroll = this.scrollRef.current;
    if (scroll) {
      scroll.scrollTo(scrollX, scrollY);
    }
  }

  componentDidUpdate(prevProps) {
    const { zoomRatio, scrollX, scrollY, loaded } = this.props;
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

    const scroll = this.scrollRef.current;
    if (scroll && loaded && !prevProps.loaded) {
      scroll.scrollTo(scrollX, scrollY);
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
    const { copySelectedEntity } = this.props;
    copySelectedEntity();
  };

  onPaste = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    e.preventDefault();
    try {
      const { pasteClipboardEntity } = this.props;
      const clipboardData = JSON.parse(clipboard.readText());
      pasteClipboardEntity(clipboardData);
    } catch (err) {
      // Clipboard isn't pastable, just ignore it
    }
  };

  onKeyDown = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    const { removeSelectedEntity, focus } = this.props;
    if (focus && e.key === "Backspace") {
      removeSelectedEntity();
    }
  };

  onMouseUp = e => {
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

  onMouseEnter = e => {
    this.mouseOver = true;
  };

  onMouseLeave = e => {
    this.mouseOver = false;
  };

  onScroll = e => {
    const { scrollWorld } = this.props;
    scrollWorld(e.currentTarget.scrollLeft, e.currentTarget.scrollTop);
  };

  onAddScene = e => {
    const { addScene, setTool, prefab } = this.props;
    const { hoverX, hoverY } = this.state;
    addScene(hoverX, hoverY, prefab);
    setTool("select");
    this.setState({ hover: false });
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
        onScroll={this.onScroll}
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
  scrollX: PropTypes.number.isRequired,
  scrollY: PropTypes.number.isRequired,
  scenes: PropTypes.arrayOf(PropTypes.string).isRequired,
  zoomRatio: PropTypes.number.isRequired,
  focus: PropTypes.bool.isRequired,
  prefab: PropTypes.shape({}),
  sidebarWidth: PropTypes.number.isRequired,
  showConnections: PropTypes.bool.isRequired,
  tool: PropTypes.string.isRequired,
  addScene: PropTypes.func.isRequired,
  setTool: PropTypes.func.isRequired,
  selectWorld: PropTypes.func.isRequired,
  removeSelectedEntity: PropTypes.func.isRequired,
  zoomIn: PropTypes.func.isRequired,
  zoomOut: PropTypes.func.isRequired,
  loaded: PropTypes.bool.isRequired,
  copySelectedEntity: PropTypes.func.isRequired,
  pasteClipboardEntity: PropTypes.func.isRequired,
  scrollWorld: PropTypes.func.isRequired
};

World.defaultProps = {
  prefab: null
};

function mapStateToProps(state) {
  const loaded = state.document.loaded;
  const scenes = state.entities.present.result.scenes;
  const {
    showConnections,
    worldScrollX: scrollX,
    worldScrollY: scrollY
  } = state.entities.present.result.settings;
  const { worldSidebarWidth: sidebarWidth } = state.settings;

  const viewportWidth = window.innerWidth - sidebarWidth - 17;
  const viewportHeight = window.innerHeight - 40 - 17;

  const scrollWidth = Math.max(viewportWidth, getMaxSceneRight(state) + 20);
  const scrollHeight = Math.max(viewportHeight, getMaxSceneBottom(state) + 60);

  const focus = state.editor.worldFocus;

  return {
    scenes,
    scrollWidth,
    scrollHeight,
    scrollX,
    scrollY,
    tool: state.tools.selected,
    prefab: state.tools.prefab,
    zoomRatio: (state.editor.zoom || 100) / 100,
    showConnections,
    sidebarWidth,
    loaded,
    focus
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
  zoomOut: actions.zoomOut,
  copySelectedEntity: actions.copySelectedEntity,
  pasteClipboardEntity: actions.pasteClipboardEntity,
  scrollWorld: actions.scrollWorld
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(World);
