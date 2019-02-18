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

  return (
    <svg
      className="Connections"
      width={width}
      height={height}
      style={{
        strokeWidth: 2 / zoomRatio
      }}
    >
      {scenes.map(scene =>
        [].concat(scene.triggers || [], scene.actors || []).map((object, index) => {
          const transitions = scriptMapTransition(object.script || []);
          return transitions.map((transition, tIndex) => {
            const destMap = scenes.find(m => m.id === transition.args.sceneId);
            if (!destMap) {
              return null;
            }
            const x1 = scene.x + (object.x + (object.width || 2) / 2) * 8;
            const x2 = destMap.x + transition.args.x * 8 + 5;
            const y1 = 20 + scene.y + (object.y + (object.height || 1) / 2) * 8;
            const y2 = 20 + destMap.y + transition.args.y * 8 + 5;
            const qx = x1 < x2 ? ((x1 + x2) * 1) / 2.1 : ((x1 + x2) * 1) / 1.9;
            const qy = y1 < y2 ? ((y1 + y2) * 1) / 2.1 : ((y1 + y2) * 1) / 1.9;
            return (
              <g key={scene.id + "_" + index}>
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
                    // opacity: 0.5
                  }}
                />
              </g>
            );
          });
        })
      )}
    </svg>
  );
};
