import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { PlusIcon, ResizeIcon, CloseIcon, BrickIcon, PaintIcon } from "../library/Icons";
import { sceneSelectors } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import settingsActions from "../../store/features/settings/settingsActions";
import entitiesActions from "../../store/features/entities/entitiesActions";

import { SceneShape, VariableShape } from "../../store/stateShape";
import { MIDDLE_MOUSE, TOOL_COLORS, TOOL_COLLISIONS, TOOL_ERASER, TOOL_TRIGGERS, TOOL_ACTORS, BRUSH_FILL, BRUSH_16PX, TOOL_SELECT, COLLISION_ALL, TILE_PROPS } from "../../consts";

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
      const { x, y, enabled, sceneId, editPlayerStartAt, setTool, selectWorld } = this.props;
      if (enabled) {
        editPlayerStartAt({sceneId, x, y});
        setTool({tool:TOOL_SELECT});
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
      selectedTileType,
      selectedBrush,
      addActor,
      addTrigger,
      sceneId,
      scene,
      actorDefaults,
      triggerDefaults,
      clipboardVariables,
      selectScene,
      showCollisions,
      showLayers,
      paintCollision,
      paintColor,
      removeActorAt,
      removeTriggerAt,
      sceneFiltered,
      editSearchTerm,
      hoverPalette,
      setSelectedPalette,
    } = this.props;
    
    if (e.nativeEvent.which === MIDDLE_MOUSE) return; // Do nothing on middle click

    this.lockX = undefined;
    this.lockY = undefined;

    if(sceneFiltered) {
      editSearchTerm(undefined);
    }

    if (tool === "actors") {
      addActor({sceneId, x, y, defaults: actorDefaults, variables: clipboardVariables});
      setTool({ tool: "select" });
    } else if (tool === "triggers") {
      addTrigger({sceneId, x, y, width: 1, height: 1, defaults: triggerDefaults, variables: clipboardVariables});
      this.startX = x;
      this.startY = y;
      this.setState({ resize: true });
      window.addEventListener("mousemove", this.onResizeTrigger);
      window.addEventListener("mouseup", this.onResizeTriggerStop);
    } else if (tool === "collisions") {
      if(!this.drawLine || this.startX === undefined || this.startY === undefined) {
        const brushSize = selectedBrush === BRUSH_16PX ? 2 : 1;
        this.drawTile = 0;
        this.isTileProp = selectedTileType & TILE_PROPS;

        // If any tile under brush is currently not filled then
        // paint collisions rather than remove them
        for(let xi=x; xi<x + brushSize; xi++) {
          for(let yi=y; yi<y + brushSize; yi++) {
            const collisionIndex = scene.width * yi + xi;
            if (selectedTileType & COLLISION_ALL) {
              // If drawing collisions replace existing collision if selected is different
              if ((scene.collisions[collisionIndex] & COLLISION_ALL) !== (selectedTileType & COLLISION_ALL)) {
                this.drawTile = selectedTileType;
              }
            } else if (selectedTileType & TILE_PROPS) {
              // If drawing props replace but keep collisions
              const tileProp = selectedTileType & TILE_PROPS;
              const currentProp = scene.collisions[collisionIndex] & TILE_PROPS;
              if (currentProp !== tileProp) {
                this.drawTile = tileProp;
              } else {
                this.drawTile = (scene.collisions[collisionIndex] & COLLISION_ALL);
              }
            }
          }
        }
      }
      if(selectedBrush === BRUSH_FILL) {
        paintCollision({ brush: selectedBrush, sceneId, x, y, value: this.drawTile, isTileProp: this.isTileProp });
      } else {
        if(this.drawLine && this.startX !== undefined && this.startY !== undefined) {
          paintCollision({ brush: selectedBrush, sceneId, x: this.startX, y: this.startY, endX: x, endY: y, value: this.drawTile, isTileProp: this.isTileProp, drawLine: true });
          this.startX = x;
          this.startY = y;
        } else {
          this.startX = x;
          this.startY = y;          
          paintCollision({ brush: selectedBrush, sceneId, x, y, value: this.drawTile, isTileProp: this.isTileProp });
        }
        window.addEventListener("mousemove", this.onCollisionsMove);
        window.addEventListener("mouseup", this.onCollisionsStop);
      }
    } else if (tool === "colors") {
      if (e.altKey) {
        setSelectedPalette({paletteIndex: hoverPalette});
        return;
      }

      if(selectedBrush === BRUSH_FILL) {
        paintColor({ brush: selectedBrush, sceneId, x, y, paletteIndex: selectedPalette });
      } else {
        if(this.drawLine && this.startX !== undefined && this.startY !== undefined) {
          paintColor({ brush: selectedBrush, sceneId, x: this.startX, y: this.startY, endX: x, endY: y, paletteIndex: selectedPalette, drawLine: true });
          this.startX = x;
          this.startY = y;
        } else {
          this.startX = x;
          this.startY = y;          
          paintColor({ brush: selectedBrush, sceneId, x, y, paletteIndex: selectedPalette });
        }
        window.addEventListener("mousemove", this.onColorsMove);
        window.addEventListener("mouseup", this.onColorsStop);
      }
    } else if (tool === "eraser") {
      if (showCollisions) {
        this.drawTile = 0;
        this.isTileProp = false;
        if(selectedBrush === BRUSH_FILL) {
          paintCollision({ brush: selectedBrush, sceneId, x, y, value: 0, isTileProp: this.isTileProp });
        } else {
          if(this.drawLine && this.startX !== undefined && this.startY !== undefined) {
            paintCollision({ brush: selectedBrush, sceneId, x: this.startX, y: this.startY, endX: x, endY: y, value: 0, isTileProp: this.isTileProp, drawLine: true });
            this.startX = x;
            this.startY = y;
          } else {
            this.startX = x;
            this.startY = y;          
            paintCollision({ brush: selectedBrush, sceneId, x, y, value: 0, isTileProp: this.isTileProp });
          }
          window.addEventListener("mousemove", this.onCollisionsMove);
          window.addEventListener("mouseup", this.onCollisionsStop);
        }
      }
      if(showLayers) {
        removeActorAt({ sceneId, x, y });
        removeTriggerAt({ sceneId, x, y });
        if (selectedBrush === BRUSH_16PX) {
          removeActorAt({ sceneId, x: x + 1, y });
          removeTriggerAt({ sceneId, x: x + 1, y });
          removeActorAt({ sceneId, x, y: y + 1 });
          removeTriggerAt({ sceneId, x, y: y + 1 });
          removeActorAt({ sceneId, x: x + 1, y: y + 1 });
          removeTriggerAt({ sceneId, x: x + 1, y: y + 1 });
        }
      }
    } else if (tool === "select") {
      selectScene({ sceneId });
    }
  };

  onResizeTrigger = e => {
    const { x, y, sceneId, entityId, resizeTrigger } = this.props;
    if (entityId && (this.currentX !== x || this.currentY !== y)) {
      resizeTrigger({sceneId, triggerId: entityId, startX: this.startX, startY: this.startY, x, y});
      this.currentX = x;
      this.currentY = y;
    }
  };

  onResizeTriggerStop = e => {
    const { setTool } = this.props;
    setTool({ tool: "select" });
    this.setState({ resize: false });
    window.removeEventListener("mousemove", this.onResizeTrigger);
    window.removeEventListener("mouseup", this.onResizeTriggerStop);
  };

  onCollisionsMove = e => {
    const {
      x,
      y,
      enabled,
      sceneId,
      selectedBrush,
      paintCollision,
    } = this.props;
    if (enabled && (this.currentX !== x || this.currentY !== y)) {
      if(this.drawLine) {
        if(this.startX === undefined || this.startY === undefined) {
          this.startX = x;
          this.startY = y;
        }
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
        paintCollision({ brush: selectedBrush, sceneId, x: this.startX, y: this.startY, endX: x1, endY: y1, value: this.drawTile, isTileProp: this.isTileProp, drawLine: true });          
        this.startX = x1;
        this.startY = y1;
      } else {
        if(this.startX === undefined || this.startY === undefined) {
          this.startX = x;
          this.startY = y;
        }
        const x1 = x;
        const y1 = y;
        paintCollision({ brush: selectedBrush, sceneId, x: this.startX, y: this.startY, endX: x1, endY: y1, value: this.drawTile, isTileProp: this.isTileProp, drawLine: true });
        this.startX = x1;
        this.startY = y1;
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
      paintColor
    } = this.props;
    if (enabled && (this.currentX !== x || this.currentY !== y)) {
      if(this.drawLine) {
        if(this.startX === undefined || this.startY === undefined) {
          this.startX = x;
          this.startY = y;
        }        
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
        paintColor({ brush: selectedBrush, sceneId, x: this.startX, y: this.startY, endX: x1, endY: y1, paletteIndex: selectedPalette, drawLine: true });          
        this.startX = x1;
        this.startY = y1;
      } else {
        if(this.startX === undefined || this.startY === undefined) {
          this.startX = x;
          this.startY = y;
        }
        const x1 = x;
        const y1 = y;
        paintColor({ brush: selectedBrush, sceneId, x: this.startX, y: this.startY, endX: x1, endY: y1, paletteIndex: selectedPalette, drawLine: true });
        this.startX = x1;
        this.startY = y1;
      }
      this.currentX = x;
      this.currentY = y;
    }
  };

  onColorsStop = e => {
    window.removeEventListener("mousemove", this.onColorsMove);
    window.removeEventListener("mouseup", this.onColorsStop);
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
          "SceneCursor--Colors": tool === TOOL_COLORS,
          "SceneCursor--Size16px": (tool === TOOL_COLORS || tool === TOOL_COLLISIONS || tool === TOOL_ERASER) && selectedBrush === BRUSH_16PX
        })}
        onMouseDown={this.onMouseDown}
        style={{
          top: y * 8,
          left: x * 8
        }}
      >
        {(tool === TOOL_ACTORS ||
          tool === TOOL_TRIGGERS ||
          tool === TOOL_ERASER ||
          tool === TOOL_COLORS ||
          tool === TOOL_COLLISIONS) && (
          <div className="SceneCursor__AddBubble">
            {tool === TOOL_ACTORS && <PlusIcon />}
            {tool === TOOL_TRIGGERS && (resize ? <ResizeIcon /> : <PlusIcon />)}
            {tool === TOOL_ERASER && <CloseIcon />}
            {tool === TOOL_COLLISIONS && <BrickIcon />}
            {tool === TOOL_COLORS && <PaintIcon />}
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
  actorDefaults: PropTypes.shape(),
  triggerDefaults: PropTypes.shape(),
  clipboardVariables: PropTypes.arrayOf(VariableShape).isRequired,
  sceneId: PropTypes.string.isRequired,
  hoverPalette: PropTypes.number.isRequired,
  scene: SceneShape.isRequired,
  showCollisions: PropTypes.bool.isRequired,
  showLayers: PropTypes.bool.isRequired,
  enabled: PropTypes.bool.isRequired,
  tool: PropTypes.string.isRequired,
  setTool: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  selectWorld: PropTypes.func.isRequired,
  addActor: PropTypes.func.isRequired,
  addTrigger: PropTypes.func.isRequired,
  editPlayerStartAt: PropTypes.func.isRequired,
  resizeTrigger: PropTypes.func.isRequired,
  removeActorAt: PropTypes.func.isRequired,
  removeTriggerAt: PropTypes.func.isRequired,
  paintCollision: PropTypes.func.isRequired,
  paintColor: PropTypes.func.isRequired,
  selectedBrush: PropTypes.string.isRequired,
  selectedPalette: PropTypes.number.isRequired
};

SceneCursor.defaultProps = {
  entityId: null,
  actorDefaults: {},
  triggerDefaults: {}
};

function mapStateToProps(state, props) {
  const { tool } = state.editor;
  const { x, y } = state.editor.hover;
  const { entityId, selectedPalette, selectedTileType, selectedBrush, showLayers, actorDefaults, triggerDefaults, clipboardVariables } = state.editor;
  const showCollisions = state.project.present.settings.showCollisions;
  const scenesLookup = sceneSelectors.selectEntities(state);
  const scene = scenesLookup[props.sceneId];

  let hoverPalette = -1;
  const hoverScene = sceneSelectors.selectById(state, state.editor.hover.sceneId);
  if (hoverScene) {
    hoverPalette = Array.isArray(scene.tileColors)
      ? scene.tileColors[x + y * scene.width]
      : 0;
  }

  return {
    x: x || 0,
    y: y || 0,
    tool,
    selectedPalette,
    selectedTileType,
    selectedBrush,
    actorDefaults,
    triggerDefaults,
    clipboardVariables,
    entityId,
    showCollisions,
    scene,
    showLayers,
    hoverPalette
  };
}

const mapDispatchToProps = {
  addActor: entitiesActions.addActor,
  removeActorAt: entitiesActions.removeActorAt,
  paintCollision: entitiesActions.paintCollision,
  paintColor: entitiesActions.paintColor,
  addTrigger: entitiesActions.addTrigger,
  removeTriggerAt: entitiesActions.removeTriggerAt,
  resizeTrigger: entitiesActions.resizeTrigger,
  selectScene: editorActions.selectScene,
  selectWorld: editorActions.selectWorld,
  setTool: editorActions.setTool,
  editPlayerStartAt: settingsActions.editPlayerStartAt,
  editDestinationPosition: entitiesActions.editDestinationPosition,
  editSearchTerm: editorActions.editSearchTerm,
  setSelectedPalette: editorActions.setSelectedPalette,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SceneCursor);
