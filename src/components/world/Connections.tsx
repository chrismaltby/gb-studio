import { Dictionary } from "@reduxjs/toolkit";
import {
  EVENT_SWITCH_SCENE,
  MAX_NESTED_SCRIPT_DEPTH,
  MIDDLE_MOUSE,
} from "consts";
import React, { useCallback, useEffect, useState } from "react";
import {
  actorPrefabSelectors,
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import {
  ActorNormalized,
  ActorDirection,
  CustomEventNormalized,
  SceneNormalized,
  ScriptEventNormalized,
  TriggerNormalized,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import editorActions from "store/features/editor/editorActions";
import styled, { css } from "styled-components";
import { ShowConnectionsSetting } from "store/features/settings/settingsState";
import {
  walkNormalizedActorScripts,
  walkNormalizedSceneSpecificScripts,
  walkNormalizedTriggerScripts,
} from "shared/lib/scripts/walk";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ensureScriptValue } from "shared/lib/scriptValue/types";
import { optimiseScriptValue } from "shared/lib/scriptValue/helpers";

interface ConnectionsProps {
  width: number;
  height: number;
  zoomRatio: number;
  editable: boolean;
}

interface CalculateTransitionCoordsProps {
  type: "actor" | "trigger" | "scene";
  scriptEvent: ScriptEventNormalized;
  scene: SceneNormalized;
  destScene: SceneNormalized;
  entityId: string;
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
  entityId: string;
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

interface ConnectionMarkerProps {
  x: number;
  y: number;
  direction: ActorDirection | undefined;
  type: ConnectionMarkerType;
  onMouseDown: (e: React.MouseEvent<SVGGElement>) => void;
}

type ConnectionMarkerType = "destination" | "player-start";

interface ConnectionMarkerSVGProps {
  $type: ConnectionMarkerType;
}

type DestinationMarkerProps = {
  x: number;
  y: number;
  direction: ActorDirection | undefined;
  sceneId: string;
  eventId: string;
  entityId: string;
  editable: boolean;
  selectionType: "actor" | "trigger" | "scene";
};

interface ConnectionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  qx: number;
  qy: number;
}

const defaultCoord = {
  type: "number",
  value: 0,
} as const;

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

  const scriptEventX = optimiseScriptValue(
    ensureScriptValue(scriptEvent.args?.x, defaultCoord)
  );
  const scriptEventY = optimiseScriptValue(
    ensureScriptValue(scriptEvent.args?.y, defaultCoord)
  );

  const x1 = startX + (entityX + entityWidth / 2) * 8;
  const x2 =
    destX + (scriptEventX.type === "number" ? scriptEventX.value : 0) * 8 + 5;
  const y1 = 20 + startY + (entityY + entityHeight / 2) * 8;
  const y2 =
    20 +
    destY +
    (scriptEventY.type === "number" ? scriptEventY.value : 0) * 8 +
    5;

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
  scene: SceneNormalized,
  eventsLookup: Dictionary<ScriptEventNormalized>,
  scenesLookup: Dictionary<SceneNormalized>,
  actorsLookup: Dictionary<ActorNormalized>,
  triggersLookup: Dictionary<TriggerNormalized>,
  actorPrefabsLookup: Dictionary<ActorPrefabNormalized>,
  triggerPrefabsLookup: Dictionary<TriggerPrefabNormalized>,
  customEventsLookup: Dictionary<CustomEventNormalized>
) => {
  const ifMatches = (
    scriptEvent: ScriptEventNormalized,
    callback: (destScene: SceneNormalized) => void
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
  walkNormalizedSceneSpecificScripts(
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
            entityId: "",
          })
        );
      });
    }
  );

  scene.actors.forEach((entityId) => {
    const entity = actorsLookup[entityId];
    if (entity) {
      walkNormalizedActorScripts(
        entity,
        eventsLookup,
        actorPrefabsLookup,
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
      walkNormalizedTriggerScripts(
        entity,
        eventsLookup,
        triggerPrefabsLookup,
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

const ConnectionMarkerSVG = styled.g<ConnectionMarkerSVGProps>`
  pointer-events: all;

  ${(props) =>
    props.$type === "player-start"
      ? css`
          rect {
            fill: rgb(255, 87, 34);
          }

          &:hover rect {
            stroke: rgb(255, 87, 34);
            stroke-width: 2px;
          }
        `
      : ""}

  ${(props) =>
    props.$type === "destination"
      ? css`
          rect {
            fill: rgb(0, 188, 212);
          }

          &:hover rect {
            stroke: rgb(0, 188, 212);
            stroke-width: 2px;
          }
        `
      : ""}
`;

const ConnectionMarker = ({
  x,
  y,
  direction,
  onMouseDown,
  type,
}: ConnectionMarkerProps) => {
  return (
    <ConnectionMarkerSVG $type={type} onMouseDown={onMouseDown}>
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
    </ConnectionMarkerSVG>
  );
};

const DestinationMarker = ({
  x,
  y,
  direction,
  selectionType,
  sceneId,
  eventId,
  entityId,
  editable,
}: DestinationMarkerProps) => {
  const dispatch = useAppDispatch();

  const onDragDestinationStop = useCallback(() => {
    dispatch(editorActions.dragDestinationStop());
    window.removeEventListener("mouseup", onDragDestinationStop);
  }, [dispatch]);

  const onDragDestinationStart = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      if (editable && e.nativeEvent.button !== MIDDLE_MOUSE) {
        e.stopPropagation();
        e.preventDefault();
        dispatch(
          editorActions.dragDestinationStart({
            eventId,
            sceneId,
            selectionType,
            entityId,
          })
        );
        window.addEventListener("mouseup", onDragDestinationStop);
      }
    },
    [
      dispatch,
      editable,
      entityId,
      eventId,
      onDragDestinationStop,
      sceneId,
      selectionType,
    ]
  );

  return (
    <ConnectionMarker
      type="destination"
      x={x}
      y={y}
      direction={direction}
      onMouseDown={onDragDestinationStart}
    />
  );
};

const Connection = ({ x1, y1, x2, y2, qx, qy }: ConnectionProps) => {
  return (
    <g>
      <path
        d={`M${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`}
        stroke="#00bcd4"
        fill="transparent"
        strokeDasharray="3"
      />
    </g>
  );
};

const Connections = ({
  width,
  height,
  zoomRatio,
  editable,
}: ConnectionsProps) => {
  const dispatch = useAppDispatch();
  const [connections, setConnections] = useState<
    ReturnType<typeof calculateTransitionCoords>[]
  >([]);
  const showConnections = useAppSelector(
    (state) => state.project.present.settings.showConnections
  );
  const selectedSceneId = useAppSelector((state) => state.editor.scene);
  const startSceneId = useAppSelector(
    (state) => state.project.present.settings.startSceneId
  );
  const startX = useAppSelector(
    (state) => state.project.present.settings.startX
  );
  const startY = useAppSelector(
    (state) => state.project.present.settings.startY
  );
  const startDirection = useAppSelector(
    (state) => state.project.present.settings.startDirection
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, selectedSceneId)
  );
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const scenesLookup = useAppSelector((state) =>
    sceneSelectors.selectEntities(state)
  );
  const startScene = scenesLookup[startSceneId] || scenes[0];
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state)
  );
  const eventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state)
  );
  const customEventsLookup = useAppSelector((state) =>
    customEventSelectors.selectEntities(state)
  );
  const actorPrefabsLookup = useAppSelector(
    actorPrefabSelectors.selectEntities
  );
  const triggerPrefabsLookup = useAppSelector(
    triggerPrefabSelectors.selectEntities
  );

  useEffect(() => {
    if (!showConnections) {
      setConnections([]);
      return;
    }
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
            actorPrefabsLookup,
            triggerPrefabsLookup,
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
    actorPrefabsLookup,
    triggerPrefabsLookup,
  ]);

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
      {connections.map((connection) => (
        <React.Fragment key={`m_${connection.sceneId}_${connection.eventId}`}>
          <Connection
            x1={connection.x1}
            x2={connection.x2}
            y1={connection.y1}
            y2={connection.y2}
            qx={connection.qx}
            qy={connection.qy}
          />
          <DestinationMarker
            x={connection.x2}
            y={connection.y2}
            sceneId={connection.sceneId}
            entityId={connection.entityId}
            eventId={connection.eventId}
            direction={connection.direction}
            selectionType={connection.type}
            editable={editable}
          />
        </React.Fragment>
      ))}
      {startScene && (
        <ConnectionMarker
          type="player-start"
          x={startX2}
          y={startY2}
          direction={startDirection}
          onMouseDown={onDragPlayerStart}
        />
      )}
    </ConnectionsSvg>
  );
};

export default Connections;
