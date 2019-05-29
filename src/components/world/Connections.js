import React from "react";
import PropTypes from "prop-types";
import { EVENT_SWITCH_SCENE } from "../../lib/compiler/eventTypes";
import { walkEvents } from "../../lib/helpers/eventSystem";
import { SceneShape, SettingsShape } from "../../reducers/stateShape";

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
  dragScene,
  dragX,
  dragY,
  entityIndex,
  entityId,
  entityX = 0,
  entityY = 0,
  entityWidth = 0,
  entityHeight = 0
}) => {
  const startX = scene.x + (dragScene === scene.id ? dragX : 0);
  const startY = scene.y + (dragScene === scene.id ? dragY : 0);
  const destX = destScene.x + (dragScene === destScene.id ? dragX : 0);
  const destY = destScene.y + (dragScene === destScene.id ? dragY : 0);

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

const Connections = React.memo(
  ({
    width,
    height,
    scenes,
    settings,
    zoomRatio,
    dragScene,
    dragX,
    dragY,
    onDragPlayerStart,
    onDragDestinationStart
  }) => {
    const connections = scenes.reduce((memo, scene) => {
      // Actor Transitions
      scene.actors.forEach((entity, entityIndex) => {
        const transitionEvents = scriptMapTransition(entity.script || []);
        transitionEvents.forEach(event => {
          const destScene = scenes.find(m => m.id === event.args.sceneId);
          if (destScene) {
            memo.push(
              calculateTransitionCoords({
                type: "actors",
                event,
                scene,
                destScene,
                dragScene,
                dragX,
                dragY,
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
      scene.triggers.forEach((entity, entityIndex) => {
        const transitionEvents = scriptMapTransition(entity.script || []);
        transitionEvents.forEach(event => {
          const destScene = scenes.find(m => m.id === event.args.sceneId);
          if (destScene) {
            memo.push(
              calculateTransitionCoords({
                type: "triggers",
                event,
                scene,
                destScene,
                dragScene,
                dragX,
                dragY,
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
        const destScene = scenes.find(m => m.id === event.args.sceneId);
        if (destScene) {
          memo.push(
            calculateTransitionCoords({
              type: "scenes",
              event,
              scene,
              destScene,
              dragScene,
              dragX,
              dragY
            })
          );
        }
      });
      return memo;
    }, []);

    const startScene =
      scenes.find(scene => scene.id === settings.startSceneId) || scenes[0];
    const startX2 =
      startScene &&
      startScene.x +
        (settings.startX || 0) * 8 +
        5 +
        (dragScene === startScene.id ? dragX : 0);
    const startY2 =
      startScene &&
      20 +
        startScene.y +
        (settings.startY || 0) * 8 +
        5 +
        (dragScene === startScene.id ? dragY : 0);
    const startDirection = startScene && settings.startDirection;

    return (
      <svg
        className="Connections"
        width={width}
        height={height}
        style={{
          strokeWidth: 2 / zoomRatio
        }}
      >
        {connections.map(({ x1, y1, x2, y2, qx, qy, eventId }) => (
          <g key={eventId}>
            <path
              d={`M${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`}
              e="M10 80 Q 95 10 180 80"
              stroke="#00bcd4"
              fill="transparent"
              strokeDasharray="3"
            />
          </g>
        ))}
        {connections.map(
          ({ x2, y2, direction, eventId, sceneId, type, entityId }) => (
            <g
              key={eventId}
              className="Connections__Destination"
              onMouseDown={() =>
                onDragDestinationStart(eventId, sceneId, type, entityId)
              }
            >
              <rect
                x={x2 - 4}
                y={y2 - 4}
                rx={4}
                ry={4}
                width={16}
                height={8}
                style={{
                  fill: "#00bcd4"
                }}
              />
              {direction === "up" && (
                <polygon
                  points={`${x2},${y2 + 2} ${x2 + 4},${y2 - 3} ${x2 + 8},${y2 +
                    2}`}
                  style={{
                    fill: "#006064"
                  }}
                />
              )}
              {direction === "down" && (
                <polygon
                  points={`${x2},${y2 - 2} ${x2 + 4},${y2 + 3} ${x2 + 8},${y2 -
                    2}`}
                  style={{
                    fill: "#006064"
                  }}
                />
              )}
              {direction === "left" && (
                <polygon
                  points={`${x2},${y2} ${x2 + 6},${y2 - 3} ${x2 + 6},${y2 + 3}`}
                  style={{
                    fill: "#006064"
                  }}
                />
              )}
              {direction === "right" && (
                <polygon
                  points={`${x2 + 8},${y2} ${x2 + 2},${y2 - 3} ${x2 + 2},${y2 +
                    3}`}
                  style={{
                    fill: "#006064"
                  }}
                />
              )}
            </g>
          )
        )}
        {startScene && (
          <g
            className="Connections__PlayerStart"
            title="Game Starting Position"
            onMouseDown={onDragPlayerStart}
          >
            <rect
              x={startX2 - 4}
              y={startY2 - 4}
              rx={4}
              ry={4}
              width={16}
              height={8}
              style={{
                fill: "#ff5722"
              }}
            />
            {startDirection === "up" && (
              <polygon
                points={`${startX2},${startY2 + 2} ${startX2 + 4},${startY2 -
                  3} ${startX2 + 8},${startY2 + 2}`}
                style={{
                  fill: "#fbe9e7"
                }}
              />
            )}
            {startDirection === "down" && (
              <polygon
                points={`${startX2},${startY2 - 2} ${startX2 + 4},${startY2 +
                  3} ${startX2 + 8},${startY2 - 2}`}
                style={{
                  fill: "#fbe9e7"
                }}
              />
            )}
            {startDirection === "left" && (
              <polygon
                points={`${startX2},${startY2} ${startX2 + 6},${startY2 -
                  3} ${startX2 + 6},${startY2 + 3}`}
                style={{
                  fill: "#fbe9e7"
                }}
              />
            )}
            {startDirection === "right" && (
              <polygon
                points={`${startX2 + 8},${startY2} ${startX2 + 2},${startY2 -
                  3} ${startX2 + 2},${startY2 + 3}`}
                style={{
                  fill: "#fbe9e7"
                }}
              />
            )}
          </g>
        )}
      </svg>
    );
  }
);

Connections.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  scenes: PropTypes.arrayOf(SceneShape).isRequired,
  settings: SettingsShape.isRequired,
  zoomRatio: PropTypes.number.isRequired,
  dragScene: PropTypes.string.isRequired,
  dragX: PropTypes.number.isRequired,
  dragY: PropTypes.number.isRequired,
  onDragPlayerStart: PropTypes.func.isRequired,
  onDragDestinationStart: PropTypes.func.isRequired
};

export default Connections;
