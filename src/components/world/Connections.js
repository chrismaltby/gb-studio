import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { EVENT_SWITCH_SCENE } from "../../lib/compiler/eventTypes";
import { walkEvents } from "../../lib/helpers/eventSystem";
import {
  SceneShape,
  ActorShape,
  TriggerShape
} from "../../reducers/stateShape";
import * as actions from "../../actions";
import {
  getScenes,
  getScenesLookup,
  getTriggersLookup,
  getActorsLookup
} from "../../reducers/entitiesReducer";

const scriptMapTransition = script => {
  const sceneTransitions = [];
  walkEvents(script, action => {
    if (action.command === EVENT_SWITCH_SCENE) {
      sceneTransitions.push(action);
    }
  });
  return sceneTransitions;
};

const calculateTransitionCoords = ({
  type,
  event,
  scene,
  destScene,
  entityIndex,
  entityId,
  entityX = 0,
  entityY = 0,
  entityWidth = 0,
  entityHeight = 0
}) => {
  const startX = scene.x;
  const startY = scene.y;
  const destX = destScene.x;
  const destY = destScene.y;

  const x1 = startX + (entityX + entityWidth / 2) * 8;
  const x2 = destX + (event.args.x || 0) * 8 + 5;
  const y1 = 20 + startY + (entityY + entityHeight / 2) * 8;
  const y2 = 20 + destY + (event.args.y || 0) * 8 + 5;
  const qx = x1 < x2 ? ((x1 + x2) * 1) / 2.1 : ((x1 + x2) * 1) / 1.9;
  const qy = y1 < y2 ? ((y1 + y2) * 1) / 2.1 : ((y1 + y2) * 1) / 1.9;

  return {
    x1,
    y1,
    x2,
    y2,
    qx,
    qy,
    type,
    eventId: event.id,
    sceneId: scene.id,
    entityId,
    direction: event.args.direction
  };
};

class Connections extends Component {
  onDragPlayerStart = e => {
    e.stopPropagation();
    e.preventDefault();
    const { dragPlayerStart } = this.props;
    dragPlayerStart();
    window.addEventListener("mouseup", this.onDragPlayerStop);
  };

  onDragPlayerStop = e => {
    const { dragPlayerStop } = this.props;
    dragPlayerStop();
    window.removeEventListener("mouseup", this.onDragPlayerStop);
  };

  onDragDestinationStart = (eventId, sceneId, selectionType, id) => e => {
    e.stopPropagation();
    e.preventDefault();
    const { dragDestinationStart } = this.props;
    dragDestinationStart(eventId, sceneId, selectionType, id);
    window.addEventListener("mouseup", this.onDragDestinationStop);
  };

  onDragDestinationStop = e => {
    const { dragDestinationStop } = this.props;
    dragDestinationStop();
    window.removeEventListener("mouseup", this.onDragDestinationStop);
  };

  renderConnection = ({ x1, y1, x2, y2, qx, qy, eventId }) => (
    <g key={eventId}>
      <path
        d={`M${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`}
        e="M10 80 Q 95 10 180 80"
        stroke="#00bcd4"
        fill="transparent"
        strokeDasharray="3"
      />
    </g>
  );

  renderMarker = ({ x, y, direction, onMouseDown, eventId, className }) => (
    <g key={eventId} className={className} onMouseDown={onMouseDown}>
      <rect x={x - 4} y={y - 4} rx={4} ry={4} width={16} height={8} />
      {direction === "up" && (
        <polygon
          points={`${x},${y + 2} ${x + 4},${y - 3} ${x + 8},${y + 2}`}
          style={{
            fill: "#fbe9e7"
          }}
        />
      )}
      {direction === "down" && (
        <polygon
          points={`${x},${y - 2} ${x + 4},${y + 3} ${x + 8},${y - 2}`}
          style={{
            fill: "#fbe9e7"
          }}
        />
      )}
      {direction === "left" && (
        <polygon
          points={`${x},${y} ${x + 6},${y - 3} ${x + 6},${y + 3}`}
          style={{
            fill: "#fbe9e7"
          }}
        />
      )}
      {direction === "right" && (
        <polygon
          points={`${x + 8},${y} ${x + 2},${y - 3} ${x + 2},${y + 3}`}
          style={{
            fill: "#fbe9e7"
          }}
        />
      )}
    </g>
  );

  render() {
    const {
      width,
      height,
      startScene,
      startX,
      startY,
      startDirection,
      zoomRatio,
      scenes,
      scenesLookup,
      actorsLookup,
      triggersLookup,
      dragging
    } = this.props;

    const connections = scenes.reduce((memo, scene) => {
      // Actor Transitions
      scene.actors.forEach((entityId, entityIndex) => {
        const entity = actorsLookup[entityId];
        const transitionEvents = scriptMapTransition(entity.script || []);
        transitionEvents.forEach(event => {
          const destScene = scenesLookup[event.args.sceneId];
          if (destScene) {
            memo.push(
              calculateTransitionCoords({
                type: "actors",
                event,
                scene,
                destScene,
                entityIndex,
                entityId: entity.id,
                entityX: entity.x,
                entityY: entity.y,
                entityWidth: entity.width || 2,
                entityHeight: entity.height || 1
              })
            );
          }
        });
      });

      // Trigger Transitions
      scene.triggers.forEach((entityId, entityIndex) => {
        const entity = triggersLookup[entityId];
        const transitionEvents = scriptMapTransition(entity.script || []);
        transitionEvents.forEach(event => {
          const destScene = scenesLookup[event.args.sceneId];
          if (destScene) {
            memo.push(
              calculateTransitionCoords({
                type: "triggers",
                event,
                scene,
                destScene,
                entityIndex,
                entityId: entity.id,
                entityX: entity.x,
                entityY: entity.y,
                entityWidth: entity.width || 2,
                entityHeight: entity.height || 1
              })
            );
          }
        });
      });

      // Scene Event Transitions
      const sceneTransitionEvents = scriptMapTransition(scene.script || []);
      sceneTransitionEvents.forEach(event => {
        const destScene = scenesLookup[event.args.sceneId];
        if (destScene) {
          memo.push(
            calculateTransitionCoords({
              type: "scenes",
              event,
              scene,
              destScene
            })
          );
        }
      });
      return memo;
    }, []);

    const startX2 = startScene && startScene.x + (startX || 0) * 8 + 5;
    const startY2 = startScene && 20 + startScene.y + (startY || 0) * 8 + 5;

    return (
      <svg
        className={cx("Connections", {
          "Connections--Dragging": dragging
        })}
        width={width}
        height={height}
        style={{
          strokeWidth: 2 / zoomRatio
        }}
      >
        {connections.map(this.renderConnection)}
        {connections.map(
          ({ x2, y2, direction, eventId, sceneId, type, entityId }) =>
            this.renderMarker({
              x: x2,
              y: y2,
              direction,
              eventId,
              className: "Connections__Destination",
              onMouseDown: this.onDragDestinationStart(
                eventId,
                sceneId,
                type,
                entityId
              )
            })
        )}
        {startScene &&
          this.renderMarker({
            x: startX2,
            y: startY2,
            className: "Connections__PlayerStart",
            direction: startDirection,
            onMouseDown: this.onDragPlayerStart
          })}
      </svg>
    );
  }
}

Connections.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  scenes: PropTypes.arrayOf(SceneShape).isRequired,
  scenesLookup: PropTypes.objectOf(SceneShape).isRequired,
  actorsLookup: PropTypes.objectOf(ActorShape).isRequired,
  triggersLookup: PropTypes.objectOf(TriggerShape).isRequired,
  startScene: SceneShape,
  startX: PropTypes.number,
  startY: PropTypes.number,
  startDirection: PropTypes.string,
  dragging: PropTypes.bool.isRequired,
  zoomRatio: PropTypes.number.isRequired,
  dragPlayerStart: PropTypes.func.isRequired,
  dragPlayerStop: PropTypes.func.isRequired,
  dragDestinationStart: PropTypes.func.isRequired,
  dragDestinationStop: PropTypes.func.isRequired
};

Connections.defaultProps = {
  startScene: null,
  startX: 0,
  startY: 0,
  startDirection: "down"
};

function mapStateToProps(state) {
  const scenes = getScenes(state);
  const scenesLookup = getScenesLookup(state);
  const actorsLookup = getActorsLookup(state);
  const triggersLookup = getTriggersLookup(state);
  const {
    startSceneId,
    startX,
    startY,
    startDirection
  } = state.entities.present.result.settings;
  const startScene = scenesLookup[startSceneId] || scenes[0];
  const { dragging } = state.editor;
  return {
    scenes,
    scenesLookup,
    actorsLookup,
    triggersLookup,
    startScene,
    startX,
    startY,
    startDirection,
    dragging: !!dragging
  };
}

const mapDispatchToProps = {
  dragPlayerStart: actions.dragPlayerStart,
  dragPlayerStop: actions.dragPlayerStop,
  dragDestinationStart: actions.dragDestinationStart,
  dragDestinationStop: actions.dragDestinationStop
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Connections);
