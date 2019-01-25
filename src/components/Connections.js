import React from "react";

const scriptMapTransition = script => {
  return script.filter(action => {
    return action.command === "TRANSITION_MAP";
  });
};

export default ({ maps }) => {
  const width =
    Math.max.apply(null, maps.map(map => map.x + map.width * 8)) + 100;
  const height =
    Math.max.apply(null, maps.map(map => 20 + map.y + map.height * 8)) + 100;

  return (
    <svg className="Connections" width={width} height={height}>
      {maps.map(map =>
        [].concat(map.triggers || [], map.actors || []).map((object, index) => {
          const transitions = scriptMapTransition(object.script || []);
          return transitions.map((transition, tIndex) => {
            const destMap = maps.find(m => m.id === transition.args.map);
            if (!destMap) {
              return null;
            }
            const x1 = map.x + (object.x + (object.width || 2) / 2) * 8;
            const x2 = destMap.x + transition.args.x * 8 + 4;
            const y1 = 20 + map.y + (object.y + (object.height || 1) / 2) * 8;
            const y2 = 20 + destMap.y + transition.args.y * 8 + 4;
            const qx = x1 < x2 ? ((x1 + x2) * 1) / 2.1 : ((x1 + x2) * 1) / 1.9;
            const qy = y1 < y2 ? ((y1 + y2) * 1) / 2.1 : ((y1 + y2) * 1) / 1.9;
            return (
              <path
                key={map.id + "_" + index}
                d={`M${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`}
                e="M10 80 Q 95 10 180 80"
                stroke="orange"
                fill="transparent"
              />
            );
          });
        })
      )}
    </svg>
  );
};
