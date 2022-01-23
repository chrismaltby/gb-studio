import { Dictionary } from "@reduxjs/toolkit";
import { MAX_NESTED_SCRIPT_DEPTH, MIDDLE_MOUSE } from "../../consts";
import { EVENT_SWITCH_SCENE } from "lib/compiler/eventTypes";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import {
  walkNormalisedActorEvents,
  walkNormalisedSceneSpecificEvents,
  walkNormalisedTriggerEvents,
} from "store/features/entities/entitiesHelpers";
import {
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import {
  Actor,
  ActorDirection,
  CustomEvent,
  Scene,
  ScriptEvent,
  Trigger,
} from "store/features/entities/entitiesTypes";
import editorActions from "store/features/editor/editorActions";
import styled from "styled-components";
import { ShowConnectionsSetting } from "store/features/settings/settingsState";

interface ConnectionsProps {
  width: number;
  height: number;
  zoomRatio: number;
  editable: boolean;
}

interface CalculateTransitionCoordsProps {
  type: "actor" | "trigger" | "scene";
  scriptEvent: ScriptEvent;
  scene: Scene;
  destScene: Scene;
  entityId?: string;
  entityX?: number;
  entityY?: number;
  entityWidth?: number;
  entityHeight?: number;
  direction?: ActorDirection;
}

interface TransitionCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  qx: number;
  qy: number;
  type: "actor" | "trigger" | "scene";
  eventId: string;
  sceneId: string;
  entityId: string | undefined;
  direction: ActorDirection;
}

const ConnectionsSvg = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  stroke-width: 2px;
  pointer-events: none;
  z-index: 11;
`;

const calculateTransitionCoords = ({
  type,
  scriptEvent,
  scene,
  destScene,
  entityId,
  entityX = 0,
  entityY = 0,
  entityWidth = 0,
  entityHeight = 0,
}: CalculateTransitionCoordsProps): TransitionCoords => {
  const startX = scene.x;
  const startY = scene.y;
  const destX = destScene.x;
  const destY = destScene.y;

  const x1 = startX + (entityX + entityWidth / 2) * 8;
  const x2 = destX + Number(scriptEvent.args?.x || 0) * 8 + 5;
  const y1 = 20 + startY + (entityY + entityHeight / 2) * 8;
  const y2 = 20 + destY + Number(scriptEvent.args?.y || 0) * 8 + 5;

  const xDiff = Math.abs(x1 - x2);
  const yDiff = Math.abs(y1 - y2);

  const xQ = xDiff < yDiff ? -0.1 * xDiff : xDiff * 0.4;
  const yQ = yDiff < xDiff ? -0.1 * yDiff : yDiff * 0.4;

  const qx = x1 < x2 ? x1 + xQ : x1 - xQ;
  const qy = y1 < y2 ? y1 + yQ : y1 - yQ;

  return {
    x1,
    y1,
    x2,
    y2,
    qx,
    qy,
    type,
    eventId: scriptEvent.id,
    sceneId: scene.id,
    entityId,
    direction: scriptEvent.args?.direction as ActorDirection,
  };
};

const getSceneConnections = (
  showConnections: ShowConnectionsSetting,
  selectedSceneId: string,
  scene: Scene,
  eventsLookup: Dictionary<ScriptEvent>,
  scenesLookup: Dictionary<Scene>,
  actorsLookup: Dictionary<Actor>,
  triggersLookup: Dictionary<Trigger>,
  customEventsLookup: Dictionary<CustomEvent>
) => {
  const ifMatches = (
    scriptEvent: ScriptEvent,
    callback: (destScene: Scene) => void
  ) => {
    if (scriptEvent.command === EVENT_SWITCH_SCENE) {
      const destId = String(scriptEvent.args?.sceneId || "");
      if (
        showConnections === "all" ||
        scene.id === selectedSceneId ||
        destId === selectedSceneId
      ) {
        const destScene = scenesLookup[destId];
        if (destScene) {
          callback(destScene);
        }
      }
    }
  };

  const connections: TransitionCoords[] = [];
  walkNormalisedSceneSpecificEvents(
    scene,
    eventsLookup,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: MAX_NESTED_SCRIPT_DEPTH,
      },
    },
    (scriptEvent) => {
      ifMatches(scriptEvent, (destScene) => {
        connections.push(
          calculateTransitionCoords({
            type: "scene",
            scriptEvent,
            scene,
            destScene,
          })
        );
      });
    }
  );

  scene.actors.forEach((entityId) => {
    const entity = actorsLookup[entityId];
    if (entity) {
      walkNormalisedActorEvents(
        entity,
        eventsLookup,
        {
          customEvents: {
            lookup: customEventsLookup,
            maxDepth: MAX_NESTED_SCRIPT_DEPTH,
          },
        },
        (scriptEvent) => {
          ifMatches(scriptEvent, (destScene) => {
            connections.push(
              calculateTransitionCoords({
                type: "actor",
                scriptEvent,
                scene,
                destScene,
                entityId: entity.id,
                entityX: entity.x,
                entityY: entity.y,
                entityWidth: 2,
                entityHeight: 1,
              })
            );
          });
        }
      );
    }
  });

  scene.triggers.forEach((entityId) => {
    const entity = triggersLookup[entityId];
    if (entity) {
      walkNormalisedTriggerEvents(
        entity,
        eventsLookup,
        {
          customEvents: {
            lookup: customEventsLookup,
            maxDepth: MAX_NESTED_SCRIPT_DEPTH,
          },
        },
        (scriptEvent) => {
          ifMatches(scriptEvent, (destScene) => {
            connections.push(
              calculateTransitionCoords({
                type: "trigger",
                scriptEvent,
                scene,
                destScene,
                entityId: entity.id,
                entityX: entity.x,
                entityY: entity.y,
                entityWidth: entity.width || 2,
                entityHeight: entity.height || 1,
              })
            );
          });
        }
      );
    }
  });

  return connections;
};

const Connections = ({
  width,
  height,
  zoomRatio,
  editable,
}: ConnectionsProps) => {
  const dispatch = useDispatch();
  const [connections, setConnections] = useState<
    ReturnType<typeof calculateTransitionCoords>[]
  >([]);
  const showConnections = useSelector(
    (state: RootState) => state.project.present.settings.showConnections
  );
  const selectedSceneId = useSelector((state: RootState) => state.editor.scene);
  const startSceneId = useSelector(
    (state: RootState) => state.project.present.settings.startSceneId
  );
  const startX = useSelector(
    (state: RootState) => state.project.present.settings.startX
  );
  const startY = useSelector(
    (state: RootState) => state.project.present.settings.startY
  );
  const startDirection = useSelector(
    (state: RootState) => state.project.present.settings.startDirection
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, selectedSceneId)
  );
  const scenes = useSelector((state: RootState) =>
    sceneSelectors.selectAll(state)
  );
  const scenesLookup = useSelector((state: RootState) =>
    sceneSelectors.selectEntities(state)
  );
  const startScene = scenesLookup[startSceneId] || scenes[0];
  const actorsLookup = useSelector((state: RootState) =>
    actorSelectors.selectEntities(state)
  );
  const triggersLookup = useSelector((state: RootState) =>
    triggerSelectors.selectEntities(state)
  );
  const eventsLookup = useSelector((state: RootState) =>
    scriptEventSelectors.selectEntities(state)
  );
  const customEventsLookup = useSelector((state: RootState) =>
    customEventSelectors.selectEntities(state)
  );

  useEffect(() => {
    setConnections(
      scenes
        .map((scene) =>
          getSceneConnections(
            showConnections,
            selectedSceneId,
            scene,
            eventsLookup,
            scenesLookup,
            actorsLookup,
            triggersLookup,
            customEventsLookup
          )
        )
        .flat()
    );
  }, [
    showConnections,
    scene,
    scenes,
    actorsLookup,
    triggersLookup,
    eventsLookup,
    scenesLookup,
    customEventsLookup,
    selectedSceneId,
  ]);

  const renderConnection = useCallback(
    ({ x1, y1, x2, y2, qx, qy, eventId, sceneId }) => {
      return (
        <g key={`c_${sceneId}_${eventId}`}>
          <path
            d={`M${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`}
            stroke="#00bcd4"
            fill="transparent"
            strokeDasharray="3"
          />
        </g>
      );
    },
    []
  );

  const renderMarker = useCallback(
    ({ x, y, direction, onMouseDown, eventId, sceneId, className }) => (
      <g
        key={`m_${sceneId}_${eventId}`}
        className={className}
        onMouseDown={onMouseDown}
      >
        <rect x={x - 4} y={y - 4} rx={4} ry={4} width={16} height={8} />
        {direction === "up" && (
          <polygon
            points={`${x},${y + 2} ${x + 4},${y - 3} ${x + 8},${y + 2}`}
            style={{
              fill: "#fbe9e7",
            }}
          />
        )}
        {direction === "down" && (
          <polygon
            points={`${x},${y - 2} ${x + 4},${y + 3} ${x + 8},${y - 2}`}
            style={{
              fill: "#fbe9e7",
            }}
          />
        )}
        {direction === "left" && (
          <polygon
            points={`${x},${y} ${x + 6},${y - 3} ${x + 6},${y + 3}`}
            style={{
              fill: "#fbe9e7",
            }}
          />
        )}
        {direction === "right" && (
          <polygon
            points={`${x + 8},${y} ${x + 2},${y - 3} ${x + 2},${y + 3}`}
            style={{
              fill: "#fbe9e7",
            }}
          />
        )}
      </g>
    ),
    []
  );

  const onDragPlayerStop = useCallback(() => {
    dispatch(editorActions.dragPlayerStop());
    window.removeEventListener("mouseup", onDragPlayerStop);
  }, [dispatch]);

  const onDragPlayerStart = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      if (editable && e.nativeEvent.button !== MIDDLE_MOUSE) {
        e.stopPropagation();
        e.preventDefault();
        dispatch(editorActions.dragPlayerStart());
        window.addEventListener("mouseup", onDragPlayerStop);
      }
    },
    [dispatch, editable, onDragPlayerStop]
  );

  const onDragDestinationStop = useCallback(() => {
    dispatch(editorActions.dragDestinationStop());
    window.removeEventListener("mouseup", onDragDestinationStop);
  }, [dispatch]);

  const onDragDestinationStart = useCallback(
    (eventId, sceneId, selectionType, id) =>
      (e: React.MouseEvent<SVGGElement>) => {
        if (editable && e.nativeEvent.button !== MIDDLE_MOUSE) {
          e.stopPropagation();
          e.preventDefault();
          dispatch(
            editorActions.dragDestinationStart({
              eventId,
              sceneId,
              selectionType,
              entityId: id,
            })
          );
          window.addEventListener("mouseup", onDragDestinationStop);
        }
      },
    [dispatch, editable, onDragDestinationStop]
  );

  const startX2 = startScene && startScene.x + (startX || 0) * 8 + 5;
  const startY2 = startScene && 20 + startScene.y + (startY || 0) * 8 + 5;

  return (
    <ConnectionsSvg
      width={width}
      height={height}
      style={{
        strokeWidth: 2 / zoomRatio,
      }}
    >
      {connections.map(renderConnection)}
      {connections.map(
        ({ x2, y2, direction, eventId, sceneId, type, entityId }) =>
          renderMarker({
            x: x2,
            y: y2,
            direction,
            eventId,
            sceneId,
            className: "Connections__Destination",
            onMouseDown: onDragDestinationStart(
              eventId,
              sceneId,
              type,
              entityId
            ),
          })
      )}
      {startScene &&
        renderMarker({
          x: startX2,
          y: startY2,
          className: "Connections__PlayerStart",
          direction: startDirection,
          onMouseDown: onDragPlayerStart,
        })}
    </ConnectionsSvg>
  );
};

export default Connections;
