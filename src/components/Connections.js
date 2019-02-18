import React from "react";
import { EVENT_SWITCH_SCENE } from "../lib/data/compiler/eventTypes";

const scriptMapTransition = script => {
  return script.filter(action => {
    return action.command === EVENT_SWITCH_SCENE;
  });
};

export default ({ scenes, zoomRatio }) => {
  const width =
    Math.max.apply(null, scenes.map(scene => scene.x + scene.width * 8)) + 100;
  const height =
    Math.max.apply(null, scenes.map(scene => 20 + scene.y + scene.height * 8)) + 100;

  const connections = scenes.reduce((memo, scene) => {
    const sceneEntities = [].concat(scene.triggers || [], scene.actors || []);
    sceneEntities.forEach((entity) => {
      const transitions = scriptMapTransition(entity.script || []);
      transitions.forEach((transition) => {
        const destScene = scenes.find(m => m.id === transition.args.sceneId);
        if (destScene) {
          const x1 = scene.x + (entity.x + (entity.width || 2) / 2) * 8;
          const x2 = destScene.x + transition.args.x * 8 + 5;
          const y1 = 20 + scene.y + (entity.y + (entity.height || 1) / 2) * 8;
          const y2 = 20 + destScene.y + transition.args.y * 8 + 5;
          const qx = x1 < x2 ? ((x1 + x2) * 1) / 2.1 : ((x1 + x2) * 1) / 1.9;
          const qy = y1 < y2 ? ((y1 + y2) * 1) / 2.1 : ((y1 + y2) * 1) / 1.9;
          memo.push({
            x1, y1, x2, y2, qx, qy, direction: transition.args.direction
          })
        }
      })
    })
    return memo;
  }, []);

  return (
    <svg
      className="Connections"
      width={width}
      height={height}
      style={{
        strokeWidth: 2 / zoomRatio
      }}
    >
      {connections.map(({ x1, y1, x2, y2, qx, qy }, index) => (
        <g key={index}>
          <path
            d={`M${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`}
            e="M10 80 Q 95 10 180 80"
            stroke="#00bcd4"
            fill="transparent"
          />
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
        </g>
      ))}
      {connections.map(({ x2, y2, direction }, index) => (
        <g key={index}>
          {direction === "up" ? (
            <polygon points={`${x2},${y2 + 2} ${x2 + 4},${y2 - 3} ${x2 + 8},${y2 + 2}`} style={{
              fill: "#006064"
            }} />
          ) : direction === "down" ? (
            <polygon points={`${x2},${y2 - 2} ${x2 + 4},${y2 + 3} ${x2 + 8},${y2 - 2}`} style={{
              fill: "#006064"
            }} />
          ) : direction === "left" ? (
            <polygon points={`${x2},${y2} ${x2 + 6},${y2 - 3} ${x2 + 6},${y2 + 3}`} style={{
              fill: "#006064"
            }} />
          ) : direction === "right" ? (
            <polygon points={`${x2 + 8},${y2} ${x2 + 2},${y2 - 3} ${x2 + 2},${y2 + 3}`} style={{
              fill: "#006064"
            }} />
          ) : null}
        </g>
      ))}
    </svg>
  )
};
