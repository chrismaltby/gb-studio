import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { PlusIcon, ResizeIcon, CloseIcon, BrickIcon } from "../library/Icons";
import { getScenesLookup } from "../../reducers/entitiesReducer";
import * as actions from "../../actions";
import { SceneShape } from "../../reducers/stateShape";
import { TOOL_COLORS, TOOL_COLLISIONS, TOOL_ERASER, TOOL_TRIGGERS, TOOL_ACTORS } from "../../consts";

class SceneCursor extends Component {
  constructor() {
    super();
    this.drawLine = false;
    this.startX = undefined;
    this.startY = undefined;
    this.lockX = undefined;
    this.lockY = undefined;
    this.state = {
      resize: false
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  onKeyDown = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if(e.shiftKey) {
      this.drawLine = true;    
    }
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    if (e.code === "KeyP") {
      const { x, y, enabled, sceneId, editPlayerStartAt } = this.props;
      if (enabled) {
        editPlayerStartAt(sceneId, x, y);
      }
    }
  };

  onKeyUp = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if(!e.shiftKey) {
      this.drawLine = false;  
    }
  };

  onMouseDown = e => {
    const {
      x,
      y,
      tool,
      setTool,
      selectedPalette,
      selectedBrush,
      addActor,
      addTrigger,
      sceneId,
      scene,
      prefab,
      selectScene,
      showCollisions,
      addCollisionTile,
      removeCollisionTile,
      paintColorTile,
      paintColorLine,
      paintColorFill,
      removeActorAt,
      removeTriggerAt
    } = this.props;

    this.lockX = undefined;
    this.lockY = undefined;     

    if (tool === "actors") {
      addActor(sceneId, x, y, prefab);
      setTool("select");
    } else if (tool === "triggers") {
      addTrigger(sceneId, x, y, prefab);
      this.startX = x;
      this.startY = y;
      this.setState({ resize: true });
      window.addEventListener("mousemove", this.onResizeTrigger);
      window.addEventListener("mouseup", this.onResizeTriggerStop);
    } else if (tool === "collisions") {
      const collisionIndex = scene.width * y + x;
      const collisionByteIndex = collisionIndex >> 3;
      const collisionByteOffset = collisionIndex & 7;
      const collisionByteMask = 1 << collisionByteOffset;
      if (scene.collisions[collisionByteIndex] & collisionByteMask) {
        removeCollisionTile(sceneId, x, y);
        this.remove = true;
      } else {
        addCollisionTile(sceneId, x, y);
        this.remove = false;
      }
      window.addEventListener("mousemove", this.onCollisionsMove);
      window.addEventListener("mouseup", this.onCollisionsStop);
    } else if (tool === "colors") {
      if(selectedBrush === "fill") {
        paintColorFill(sceneId, x, y, selectedPalette);
      } else {
        const brushSize = selectedBrush === "16px" ? 2 : 1;
        if(this.drawLine && this.startX !== undefined && this.startY !== undefined) {
          paintColorLine(sceneId, this.startX, this.startY, x, y, selectedPalette, brushSize);
          this.startX = x;
          this.startY = y;
        } else {
          this.startX = x;
          this.startY = y;          
          paintColorTile(sceneId, x, y, selectedPalette, brushSize);
        }
        window.addEventListener("mousemove", this.onColorsMove);
        window.addEventListener("mouseup", this.onColorsStop);
      }
    } else if (tool === "eraser") {
      if (showCollisions) {
        removeCollisionTile(sceneId, x, y);
      }
      removeActorAt(sceneId, x, y);
      removeTriggerAt(sceneId, x, y);
      window.addEventListener("mousemove", this.onEraserMove);
      window.addEventListener("mouseup", this.onEraserStop);
    } else if (tool === "select") {
      selectScene(sceneId);
    }
  };

  onResizeTrigger = e => {
    const { x, y, sceneId, entityId, resizeTrigger } = this.props;
    if (entityId && (this.currentX !== x || this.currentY !== y)) {
      resizeTrigger(sceneId, entityId, this.startX, this.startY, x, y);
      this.currentX = x;
      this.currentY = y;
    }
  };

  onResizeTriggerStop = e => {
    const { setTool } = this.props;
    setTool("select");
    this.setState({ resize: false });
    window.removeEventListener("mousemove", this.onResizeTrigger);
    window.removeEventListener("mouseup", this.onResizeTriggerStop);
  };

  onCollisionsMove = e => {
    const {
      x,
      y,
      sceneId,
      addCollisionTile,
      removeCollisionTile
    } = this.props;
    if (this.currentX !== x || this.currentY !== y) {
      if (this.remove) {
        removeCollisionTile(sceneId, x, y);
      } else {
        addCollisionTile(sceneId, x, y);
      }
      this.currentX = x;
      this.currentY = y;
    }
  };

  onCollisionsStop = e => {
    window.removeEventListener("mousemove", this.onCollisionsMove);
    window.removeEventListener("mouseup", this.onCollisionsStop);
  };

  onColorsMove = e => {
    const {
      x,
      y,
      enabled,
      sceneId,
      selectedPalette,
      selectedBrush,
      paintColorTile,
      paintColorLine
    } = this.props;
    if (enabled && (this.currentX !== x || this.currentY !== y)) {
      const brushSize = selectedBrush === "16px" ? 2 : 1;

      if(this.drawLine) {
        let x1 = x;
        let y1 = y;
        if(this.lockX) {
          x1 = this.startX;
        } else if(this.lockY) {
          y1 = this.startY;
        } else if (x !== this.startX) {
          this.lockY = true;
          y1 = this.startY;
        } else if (y !== this.startY) {
          this.lockX = true;
          x1 = this.startX;
        }
        paintColorLine(sceneId, this.startX, this.startY, x1, y1, selectedPalette, brushSize);        
        this.startX = x1;
        this.startY = y1;
      } else {
        paintColorTile(sceneId, x, y, selectedPalette, brushSize);
      }
      this.currentX = x;
      this.currentY = y;
    }
  };

  onColorsStop = e => {
    window.removeEventListener("mousemove", this.onColorsMove);
    window.removeEventListener("mouseup", this.onColorsStop);
  };  

  onEraserMove = e => {
    const { x, y, sceneId, showCollisions, removeCollisionTile } = this.props;
    if (this.currentX !== x || this.currentY !== y) {
      if (showCollisions) {
        removeCollisionTile(sceneId, x, y);
      }
      this.currentX = x;
      this.currentY = y;
    }
  };

  onEraserStop = e => {
    window.removeEventListener("mousemove", this.onEraserMove);
    window.removeEventListener("mouseup", this.onEraserStop);
  };

  render() {
    const { x, y, tool, enabled, selectedBrush } = this.props;
    const { resize } = this.state;
    if (!enabled) {
      return <div />;
    }
    return (
      <div
        className={cx("SceneCursor", {
          "SceneCursor--AddActor": tool === TOOL_ACTORS,
          "SceneCursor--AddTrigger": tool === TOOL_TRIGGERS,
          "SceneCursor--Eraser": tool === TOOL_ERASER,
          "SceneCursor--Collisions": tool === TOOL_COLLISIONS,
          "SceneCursor--Size16px": (tool === TOOL_COLORS || tool === TOOL_COLLISIONS || tool === TOOL_ERASER) && selectedBrush === "16px"
        })}
        onMouseDown={this.onMouseDown}
        style={{
          top: y * 8,
          left: x * 8
        }}
      >
        {(tool === "actors" ||
          tool === "triggers" ||
          tool === "eraser" ||
          tool === "collisions") && (
          <div className="SceneCursor__AddBubble">
            {tool === "actors" && <PlusIcon />}
            {tool === "triggers" && (resize ? <ResizeIcon /> : <PlusIcon />)}
            {tool === "eraser" && <CloseIcon />}
            {tool === "collisions" && <BrickIcon />}
          </div>
        )}
      </div>
    );
  }
}

SceneCursor.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  entityId: PropTypes.string,
  prefab: PropTypes.shape(),
  sceneId: PropTypes.string.isRequired,
  scene: SceneShape.isRequired,
  showCollisions: PropTypes.bool.isRequired,
  enabled: PropTypes.bool.isRequired,
  tool: PropTypes.string.isRequired,
  setTool: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  addActor: PropTypes.func.isRequired,
  addTrigger: PropTypes.func.isRequired,
  addCollisionTile: PropTypes.func.isRequired,
  editPlayerStartAt: PropTypes.func.isRequired,
  resizeTrigger: PropTypes.func.isRequired,
  removeActorAt: PropTypes.func.isRequired,
  removeTriggerAt: PropTypes.func.isRequired,
  removeCollisionTile: PropTypes.func.isRequired
};

SceneCursor.defaultProps = {
  entityId: null,
  prefab: {}
};

function mapStateToProps(state, props) {
  const { selected: tool, prefab } = state.tools;
  const { x, y } = state.editor.hover;
  const { type: editorType, entityId, selectedPalette, selectedBrush } = state.editor;
  const showCollisions = state.entities.present.result.settings.showCollisions;
  const scenesLookup = getScenesLookup(state);
  const scene = scenesLookup[props.sceneId];
  return {
    x: x || 0,
    y: y || 0,
    tool,
    selectedPalette,
    selectedBrush,
    prefab,
    editorType,
    entityId,
    showCollisions,
    scene
  };
}

const mapDispatchToProps = {
  addActor: actions.addActor,
  removeActorAt: actions.removeActorAt,
  addCollisionTile: actions.addCollisionTile,
  removeCollisionTile: actions.removeCollisionTile,
  paintColorTile: actions.paintColorTile,
  paintColorLine: actions.paintColorLine,
  paintColorFill: actions.paintColorFill,
  addTrigger: actions.addTrigger,
  removeTriggerAt: actions.removeTriggerAt,
  resizeTrigger: actions.resizeTrigger,
  selectScene: actions.selectScene,
  setTool: actions.setTool,
  editPlayerStartAt: actions.editPlayerStartAt,
  editDestinationPosition: actions.editDestinationPosition
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SceneCursor);
