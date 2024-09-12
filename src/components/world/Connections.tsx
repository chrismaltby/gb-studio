import { MIDDLE_MOUSE } from "consts";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  actorPrefabSelectors,
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { ActorDirection } from "shared/lib/entities/entitiesTypes";
import editorActions from "store/features/editor/editorActions";
import styled, { css } from "styled-components";
import { useAppDispatch, useAppSelector } from "store/hooks";
import ConnectionsWorker, {
  ConnectionsWorkerRequest,
  ConnectionsWorkerResult,
  TransitionCoords,
} from "./Connections.worker";

const worker = new ConnectionsWorker();

interface ConnectionsProps {
  width: number;
  height: number;
  zoomRatio: number;
  editable: boolean;
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
  const [connections, setConnections] = useState<TransitionCoords[]>([]);
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

  const calculate = useCallback(() => {
    if (isWorking.current) {
      isWorkQueued.current = true;
      return;
    }
    isWorking.current = true;
    const request: ConnectionsWorkerRequest = {
      showConnections,
      selectedSceneId,
      scenes,
      eventsLookup,
      scenesLookup,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      customEventsLookup,
    };
    worker.postMessage(request);
  }, [
    actorPrefabsLookup,
    actorsLookup,
    customEventsLookup,
    eventsLookup,
    scenes,
    scenesLookup,
    selectedSceneId,
    showConnections,
    triggerPrefabsLookup,
    triggersLookup,
  ]);

  const isWorking = useRef(false);
  const isWorkQueued = useRef(false);

  const onWorkerComplete = useCallback(
    (e: MessageEvent<ConnectionsWorkerResult>) => {
      isWorking.current = false;
      setConnections(e.data.connections);
      if (isWorkQueued.current) {
        isWorkQueued.current = false;
        calculate();
      }
    },
    [calculate]
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  useEffect(() => {
    calculate();
  }, [calculate]);

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
