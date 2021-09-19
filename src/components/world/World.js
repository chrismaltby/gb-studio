import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import throttle from "lodash/throttle";
import Scene from "./Scene";
import WorldHelp from "./WorldHelp";
import Connections from "./Connections";
import { MIDDLE_MOUSE, TOOL_COLORS, TOOL_COLLISIONS, TOOL_ERASER } from "../../consts";
import { SceneShape, VariableShape } from "../../store/stateShape";
import { sceneSelectors, getMaxSceneRight, getMaxSceneBottom } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import entitiesActions from "../../store/features/entities/entitiesActions";

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
    this.worldRef = React.createRef();
    this.scrollContentsRef = React.createRef();
    this.dragDistance = { x:0, y:0 };
  }

  componentDidMount() {
    window.addEventListener("copy", this.onCopy);
    window.addEventListener("paste", this.onPaste);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousewheel", this.onMouseWheel, { passive: false });
    window.addEventListener("resize", this.onWindowResize);

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

    const { resizeWorldView } = this.props;
    resizeWorldView({width: window.innerWidth, height: window.innerHeight});
  }

  componentDidUpdate(prevProps) {
    const { zoomRatio, scrollX, scrollY, loaded, onlyMatchingScene } = this.props;
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
    
    const sceneMatchesPrevious = !!(onlyMatchingScene !== null && prevProps.onlyMatchingScene !== null && onlyMatchingScene.id === prevProps.onlyMatchingScene.id);
    if(onlyMatchingScene && !sceneMatchesPrevious) {
      const view = this.scrollRef.current;
      const viewContents = this.scrollContentsRef.current;
      const halfViewWidth = 0.5 * view.clientWidth;
      const halfViewHeight = 0.5 * view.clientHeight;
      const newScrollX = ((onlyMatchingScene.x + (onlyMatchingScene.width * 8 * 0.5)) * zoomRatio) - halfViewWidth;
      const newScrollY = ((onlyMatchingScene.y + (onlyMatchingScene.height * 8 * 0.5)) * zoomRatio) - halfViewHeight;
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
    if (focus && (e.key === "Backspace" || e.key === "Delete")) {
      removeSelectedEntity();
    }
  };

  onMouseUp = e => {
    const { selectWorld } = this.props;
    if(this.worldDragging) {
      if(Math.abs(this.dragDistance.x) < 20 && Math.abs(this.dragDistance.y) < 20) {
        if (e.target === this.worldRef.current) {
          selectWorld();
        }
      }
    }
    this.worldDragging = false;
  };

  onMouseMove = e => {
    const { tool } = this.props;
    if (this.worldDragging) {
      e.currentTarget.scrollLeft -= e.movementX;
      e.currentTarget.scrollTop -= e.movementY;
      this.dragDistance.x -= e.movementX;
      this.dragDistance.y -= e.movementY;      
    } else {
      const boundingRect = e.currentTarget.getBoundingClientRect();
      const x = e.pageX + e.currentTarget.scrollLeft - boundingRect.x;
      const y = e.pageY + e.currentTarget.scrollTop - boundingRect.y - 0;

      this.offsetX = e.pageX - boundingRect.x;
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
    if (e.ctrlKey && !this.blockWheelZoom) {
      e.preventDefault();
      if (e.wheelDelta > 0) {
        zoomIn({section: "world", delta: e.deltaY * 0.5});
      } else {
        zoomOut({section: "world", delta: e.deltaY * 0.5});
      }
    } else {
      // Don't allow mousehwheel zoom while scrolling
      clearTimeout(this.blockWheelZoom);
      this.blockWheelZoom = setTimeout(() => {
        this.blockWheelZoom = null;
      }, 60);
    }
  };

  startWorldDrag = e => {
    this.worldDragging = true;
    this.dragDistance.x = 0;
    this.dragDistance.y = 0;
  };

  startWorldDragIfAltOrMiddleClick = e => {
    if (e.altKey || e.nativeEvent.which === MIDDLE_MOUSE) {
      this.worldDragging = true;
      e.preventDefault();
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
    this.onScrollThrottled(e.currentTarget.scrollLeft, e.currentTarget.scrollTop);
  }

  onScrollThrottled = throttle((left, top) => {
    const { scrollWorld } = this.props;
    scrollWorld({x:left, y:top});
  }, 50);

  onWindowResize = e => {
    const { resizeWorldView } = this.props;
    resizeWorldView({width: window.innerWidth, height: window.innerHeight});
  }

  onAddScene = e => {
    const { addScene, setTool, sceneDefaults, clipboardVariables } = this.props;
    const { hoverX, hoverY } = this.state;
    addScene({x: hoverX, y: hoverY, defaults: sceneDefaults, variables: clipboardVariables});
    setTool({tool:"select"});
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
      loaded
    } = this.props;
    const { hover, hoverX, hoverY } = this.state;

    const worldStyle = { right: sidebarWidth };
    
    return (
      <div
        ref={this.scrollRef}
        className="World"
        onMouseMove={this.onMouseMove}
        onMouseOver={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onMouseDown={this.startWorldDragIfAltOrMiddleClick}
        onScroll={this.onScroll}
      >
        <div ref={this.scrollContentsRef} className="World__Content">
          <div
            ref={this.worldRef}
            className="World__Grid"
            style={{ width: scrollWidth, height: scrollHeight }}
            onMouseDown={this.startWorldDrag}
          />

          {loaded && scenes.length === 0 && <WorldHelp />}

          {scenes.map((sceneId, index) => (
            <Scene
              key={sceneId}
              id={sceneId}
              index={index}
            />
          ))}

          {showConnections&& (
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
                top: hoverY,
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
  sceneDefaults: PropTypes.shape({}),
  clipboardVariables: PropTypes.arrayOf(VariableShape).isRequired,
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
  scrollWorld: PropTypes.func.isRequired,
  onlyMatchingScene: SceneShape
};

World.defaultProps = {
  sceneDefaults: null,
  onlyMatchingScene: null
};

function mapStateToProps(state) {
  const loaded = state.document.loaded;
  const scenes = sceneSelectors.selectIds(state)
  const scenesLookup = sceneSelectors.selectEntities(state);

  const {
    showConnections
  } = state.project.present.settings;
  const {
    worldScrollX: scrollX,
    worldScrollY: scrollY,
    showLayers,
    sceneDefaults,
    clipboardVariables,
    focusSceneId
  } = state.editor;
  
  const { worldSidebarWidth: sidebarWidth } = state.editor;

  const viewportWidth = window.innerWidth - sidebarWidth - 17;
  const viewportHeight = window.innerHeight - 40 - 17;

  const scrollWidth = Math.max(viewportWidth, getMaxSceneRight(state) + 20);
  const scrollHeight = Math.max(viewportHeight, getMaxSceneBottom(state) + 60);

  const focus = state.editor.worldFocus;

  const searchTerm = state.editor.searchTerm;

  const matchingScenes = searchTerm ? 
    scenes.filter((scene, sceneIndex) => {
      const sceneName = scenesLookup[scene].name || `Scene ${sceneIndex + 1}`;
      return searchTerm === scene || sceneName.toUpperCase().indexOf(searchTerm.toUpperCase()) !== -1;
    })
    : [];

  const onlyMatchingScene = (matchingScenes.length === 1
    && scenesLookup[matchingScenes[0]]) || scenesLookup[focusSceneId] || null;

  const { tool } = state.editor;

  return {
    scenes,
    scrollWidth,
    scrollHeight,
    scrollX,
    scrollY,
    tool,
    sceneDefaults,
    clipboardVariables,
    zoomRatio: (state.editor.zoom || 100) / 100,
    showConnections: (!!showConnections) && (showLayers || (tool !== TOOL_COLORS && tool !== TOOL_COLLISIONS && tool !== TOOL_ERASER)),
    sidebarWidth,
    loaded,
    focus,
    onlyMatchingScene
  };
}

const mapDispatchToProps = {
  addScene: entitiesActions.addScene,
  setTool: editorActions.setTool,
  selectWorld: editorActions.selectWorld,
  removeSelectedEntity: entitiesActions.removeSelectedEntity,
  zoomIn: editorActions.zoomIn,
  zoomOut: editorActions.zoomOut,
  copySelectedEntity: clipboardActions.copySelectedEntity,
  pasteClipboardEntity: clipboardActions.pasteClipboardEntity,
  scrollWorld: editorActions.scrollWorld,
  resizeWorldView: editorActions.resizeWorldView,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(World);
