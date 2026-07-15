import { EVENT_SWITCH_SCENE, MIDDLE_MOUSE } from "consts";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  actorPrefabSelectors,
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import styled, { css } from "styled-components";
import {
  useAppDispatch,
  useAppSelector,
  useAppSelectorMapArray,
  useAppSelectorPick,
  useAppStore,
} from "store/hooks";
import type {
  ConnectionScene,
  ConnectionScriptEvent,
  ConnectionScriptSource,
  ConnectionsWorkerRequest,
  ConnectionsWorkerResult,
  SceneTransition,
} from "./Connections.worker";
import throttle from "lodash/throttle";
import { ActorDirection } from "shared/lib/resources/types";
import type { RootState } from "store/storeTypes";
import {
  actorScriptKeys,
  sceneScriptKeys,
  triggerScriptKeys,
} from "shared/lib/entities/entitiesTypes";

const worker = new Worker(new URL("./Connections.worker.ts", import.meta.url));

interface ConnectionsProps {
  width: number;
  height: number;
  zoomRatio: number;
  editable: boolean;
}

const ConnectionMarkerSVG = styled.g`
  pointer-events: all;

  rect {
    fill: rgb(0, 188, 212);
  }

  &:hover rect {
    stroke: rgb(0, 188, 212);
    stroke-width: 2px;
  }
`;

const ConnectionsSvg = styled.svg<{ $isDragging: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  stroke-width: 2px;
  pointer-events: none;
  z-index: 11;

  &:hover {
    z-index: 50;
  }

  ${(props) =>
    props.$isDragging &&
    css`
      ${ConnectionMarkerSVG} {
        pointer-events: none;
      }
    `}
`;

interface ConnectionMarkerProps {
  x: number;
  y: number;
  direction: ActorDirection | undefined;
  onMouseDown: (e: React.MouseEvent<SVGGElement>) => void;
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

interface SceneConnectionProps {
  connection: SceneTransition;
  editable: boolean;
}

interface ConnectionGeometry {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  qx: number;
  qy: number;
  direction: ActorDirection | undefined;
}

const buildConnectionsWorkerRequest = (
  state: RootState,
): ConnectionsWorkerRequest => {
  const showConnections = state.project.present.settings.showConnections;
  const scenesLookup = sceneSelectors.selectEntities(state);
  const actorsLookup = actorSelectors.selectEntities(state);
  const triggersLookup = triggerSelectors.selectEntities(state);
  const actorPrefabsLookup = actorPrefabSelectors.selectEntities(state);
  const triggerPrefabsLookup = triggerPrefabSelectors.selectEntities(state);

  const toOverrides = (
    overrides: Record<string, { args?: Record<string, unknown> }> | undefined,
  ): ConnectionScriptSource["overrides"] => {
    if (!overrides) {
      return undefined;
    }
    const connectionOverrides = Object.entries(overrides)
      .filter(
        ([, override]) =>
          override.args?.sceneId !== undefined ||
          override.args?.customEventId !== undefined ||
          override.args?.x !== undefined ||
          override.args?.y !== undefined ||
          override.args?.direction !== undefined,
      )
      .map(([id, override]) => [
        id,
        {
          sceneId:
            override.args?.sceneId === undefined
              ? undefined
              : String(override.args.sceneId),
          customEventId:
            override.args?.customEventId === undefined
              ? undefined
              : String(override.args.customEventId),
          x: override.args?.x,
          y: override.args?.y,
          direction: override.args?.direction as ActorDirection | undefined,
        },
      ]);
    return connectionOverrides.length
      ? Object.fromEntries(connectionOverrides)
      : undefined;
  };

  const toActor = (id: string): ConnectionScriptSource | undefined => {
    const actor = actorsLookup[id];
    if (!actor) return undefined;
    const prefab = actor.prefabId
      ? actorPrefabsLookup[actor.prefabId]
      : undefined;
    const scriptOwner = prefab || actor;
    return {
      id,
      scripts: actorScriptKeys.map((key) => scriptOwner[key]),
      overrides: prefab ? toOverrides(actor.prefabScriptOverrides) : undefined,
    };
  };

  const toTrigger = (id: string): ConnectionScriptSource | undefined => {
    const trigger = triggersLookup[id];
    if (!trigger) return undefined;
    const prefab = trigger.prefabId
      ? triggerPrefabsLookup[trigger.prefabId]
      : undefined;
    const scriptOwner = prefab || trigger;
    return {
      id,
      scripts: triggerScriptKeys.map((key) => scriptOwner[key]),
      overrides: prefab
        ? toOverrides(trigger.prefabScriptOverrides)
        : undefined,
    };
  };

  const scenes = sceneSelectors
    .selectAll(state)
    .map((scene): ConnectionScene => ({
      id: scene.id,
      scripts: sceneScriptKeys.map((key) => scene[key]),
      actors: scene.actors
        .map(toActor)
        .filter((actor): actor is ConnectionScriptSource => !!actor),
      triggers: scene.triggers
        .map(toTrigger)
        .filter((trigger): trigger is ConnectionScriptSource => !!trigger),
    }));

  const events = Object.fromEntries(
    scriptEventSelectors.selectAll(state).map((event) => {
      const compactEvent: ConnectionScriptEvent = {
        id: event.id,
        command: event.command,
        sceneId:
          event.args?.sceneId === undefined
            ? undefined
            : String(event.args.sceneId),
        customEventId:
          event.args?.customEventId === undefined
            ? undefined
            : String(event.args.customEventId),
        x: event.args?.x,
        y: event.args?.y,
        direction: event.args?.direction as ActorDirection | undefined,
        commented: !!event.args?.__comment,
        children: event.children
          ? Object.values(event.children).filter(
              (child): child is string[] => !!child,
            )
          : undefined,
      };
      return [event.id, compactEvent];
    }),
  );

  return {
    showConnections,
    selectedSceneId: showConnections === "all" ? "" : state.editor.scene,
    scenes,
    sceneIds: Object.keys(scenesLookup),
    events,
    customEvents: Object.fromEntries(
      customEventSelectors
        .selectAll(state)
        .map((customEvent) => [customEvent.id, customEvent.script]),
    ),
  };
};

const scriptSourceTopologySignature = (
  source: Record<string, unknown>,
  scriptKeys: readonly string[],
) =>
  JSON.stringify({
    id: source.id,
    prefabId: source.prefabId,
    scripts: scriptKeys.map((key) => source[key]),
    overrides:
      source.prefabScriptOverrides &&
      Object.entries(
        source.prefabScriptOverrides as Record<
          string,
          { args?: Record<string, unknown> }
        >,
      )
        .filter(
          ([, override]) =>
            override.args?.sceneId !== undefined ||
            override.args?.customEventId !== undefined ||
            override.args?.x !== undefined ||
            override.args?.y !== undefined ||
            override.args?.direction !== undefined,
        )
        .map(([id, override]) => [
          id,
          override.args?.sceneId,
          override.args?.customEventId,
          override.args?.x,
          override.args?.y,
          override.args?.direction,
        ]),
  });

const getConnectionId = (connection: SceneTransition) =>
  `${connection.fromSceneId}_${connection.entityId}_${connection.eventId}`;

const ConnectionMarker = memo(
  ({ x, y, direction, onMouseDown }: ConnectionMarkerProps) => {
    return (
      <ConnectionMarkerSVG onMouseDown={onMouseDown}>
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
  },
);

const DestinationMarker = memo(
  ({
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
            }),
          );
        }
      },
      [dispatch, editable, entityId, eventId, sceneId, selectionType],
    );

    return (
      <ConnectionMarker
        x={x}
        y={y}
        direction={direction}
        onMouseDown={onDragDestinationStart}
      />
    );
  },
);

const Connection = memo(({ x1, y1, x2, y2, qx, qy }: ConnectionProps) => {
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
});

const useConnectionGeometry = (
  connection: SceneTransition,
): ConnectionGeometry | undefined => {
  const fromScene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, connection.fromSceneId),
    ["x", "y"],
  );

  const scriptEvent = useAppSelectorPick(
    (state) => scriptEventSelectors.selectById(state, connection.eventId),
    ["command"],
  );

  const toScene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, connection.toSceneId),
    ["x", "y"],
  );

  const actor = useAppSelectorPick(
    (state) =>
      connection.type === "actor"
        ? actorSelectors.selectById(state, connection.entityId)
        : undefined,
    ["x", "y"],
  );

  const trigger = useAppSelectorPick(
    (state) =>
      connection.type === "trigger"
        ? triggerSelectors.selectById(state, connection.entityId)
        : undefined,
    ["x", "y", "width", "height"],
  );

  return useMemo(() => {
    if (!scriptEvent || scriptEvent.command !== EVENT_SWITCH_SCENE) {
      return undefined;
    }

    if (!fromScene || !toScene) {
      return undefined;
    }

    const toX = connection.toX;
    const toY = connection.toY;

    let entityX = 0;
    let entityY = 0;
    let entityWidth = 0;
    let entityHeight = 0;

    if (connection.type === "trigger") {
      if (!trigger) {
        return undefined;
      }

      entityX = trigger.x;
      entityY = trigger.y;
      entityWidth = trigger.width ?? 2;
      entityHeight = trigger.height ?? 1;
    } else if (connection.type === "actor") {
      if (!actor) {
        return undefined;
      }

      entityX = actor.x;
      entityY = actor.y;
      entityWidth = 2;
      entityHeight = 1;
    }

    const x1 = fromScene.x + (entityX + entityWidth / 2) * 8;
    const x2 = toScene.x + toX * 8 + 4;
    const y1 = 20 + fromScene.y + (entityY + entityHeight / 2) * 8;
    const y2 = 20 + toScene.y + toY * 8 + 4;

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
      direction: connection.direction,
    };
  }, [
    actor,
    connection.direction,
    connection.toX,
    connection.toY,
    connection.type,
    fromScene,
    scriptEvent,
    toScene,
    trigger,
  ]);
};

const SceneConnection = memo(
  ({ connection, editable }: SceneConnectionProps) => {
    const geometry = useConnectionGeometry(connection);

    if (!geometry) {
      return null;
    }

    return (
      <>
        <Connection
          x1={geometry.x1}
          x2={geometry.x2}
          y1={geometry.y1}
          y2={geometry.y2}
          qx={geometry.qx}
          qy={geometry.qy}
        />
        <DestinationMarker
          x={geometry.x2}
          y={geometry.y2}
          sceneId={connection.fromSceneId}
          entityId={connection.entityId}
          eventId={connection.eventId}
          direction={geometry.direction}
          selectionType={connection.type}
          editable={editable}
        />
      </>
    );
  },
);

const Connections = ({
  width,
  height,
  zoomRatio,
  editable,
}: ConnectionsProps) => {
  const store = useAppStore();
  const [connections, setConnections] = useState<SceneTransition[]>([]);

  const showConnections = useAppSelector(
    (state) => state.project.present.settings.showConnections,
  );
  const selectedSceneId = useAppSelector((state) => state.editor.scene);
  const isDragging = useAppSelector((state) => !!state.editor.dragging);

  // These hooks recompute small signatures for comparison on a store update,
  // but retain their array identity when only geometry or presentation data
  // changed. In particular, scene tiledata and coordinates are never read.
  const sceneTopology = useAppSelectorMapArray(
    sceneSelectors.selectAll,
    (scene) =>
      JSON.stringify({
        id: scene.id,
        actors: scene.actors,
        triggers: scene.triggers,
        scripts: sceneScriptKeys.map((key) => scene[key]),
      }),
  );
  const actorTopology = useAppSelectorMapArray(
    actorSelectors.selectAll,
    (actor) => scriptSourceTopologySignature(actor, actorScriptKeys),
  );
  const triggerTopology = useAppSelectorMapArray(
    triggerSelectors.selectAll,
    (trigger) => scriptSourceTopologySignature(trigger, triggerScriptKeys),
  );
  const actorPrefabTopology = useAppSelectorMapArray(
    actorPrefabSelectors.selectAll,
    (prefab) => scriptSourceTopologySignature(prefab, actorScriptKeys),
  );
  const triggerPrefabTopology = useAppSelectorMapArray(
    triggerPrefabSelectors.selectAll,
    (prefab) => scriptSourceTopologySignature(prefab, triggerScriptKeys),
  );
  const eventTopology = useAppSelectorMapArray(
    scriptEventSelectors.selectAll,
    (event) =>
      JSON.stringify({
        id: event.id,
        command: event.command,
        sceneId: event.args?.sceneId,
        customEventId: event.args?.customEventId,
        x: event.args?.x,
        y: event.args?.y,
        direction: event.args?.direction,
        commented: !!event.args?.__comment,
        children: event.children,
      }),
  );
  const customEventTopology = useAppSelectorMapArray(
    customEventSelectors.selectAll,
    (customEvent) => JSON.stringify([customEvent.id, customEvent.script]),
  );

  const topologyInputs: readonly unknown[] = [
    actorPrefabTopology,
    actorTopology,
    customEventTopology,
    eventTopology,
    sceneTopology,
    showConnections,
    showConnections === "all" ? "" : selectedSceneId,
    triggerPrefabTopology,
    triggerTopology,
  ];
  const workerRequestCache = useRef<{
    inputs: readonly unknown[];
    request: ConnectionsWorkerRequest;
  } | null>(null);
  const cachedWorkerRequest = workerRequestCache.current;
  let workerRequest: ConnectionsWorkerRequest;
  if (
    !cachedWorkerRequest ||
    cachedWorkerRequest.inputs.some(
      (input, index) => input !== topologyInputs[index],
    )
  ) {
    workerRequest = buildConnectionsWorkerRequest(store.getState());
    workerRequestCache.current = {
      inputs: topologyInputs,
      request: workerRequest,
    };
  } else {
    workerRequest = cachedWorkerRequest.request;
  }

  const isWorking = useRef(false);
  const isWorkQueued = useRef(false);

  const calculate = useCallback(() => {
    const state = store.getState();
    const showConnections = state.project.present.settings.showConnections;

    if (!showConnections) {
      isWorkQueued.current = false;
      isWorking.current = false;
      setConnections([]);
      return;
    }

    if (isWorking.current) {
      isWorkQueued.current = true;
      return;
    }

    isWorking.current = true;
    worker.postMessage(workerRequest);
  }, [store, workerRequest]);

  const onWorkerComplete = useCallback(
    (e: MessageEvent<ConnectionsWorkerResult>) => {
      isWorking.current = false;

      if (!store.getState().project.present.settings.showConnections) {
        setConnections([]);
      } else {
        setConnections(e.data.connections);
      }

      if (isWorkQueued.current) {
        isWorkQueued.current = false;
        calculate();
      }
    },
    [calculate, store],
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  const currentCalculate = useRef(calculate);
  useEffect(() => {
    currentCalculate.current = calculate;
  }, [calculate]);

  const throttledCalculate = useMemo(
    () => throttle(() => currentCalculate.current(), 100),
    [],
  );

  useEffect(() => {
    throttledCalculate();
  }, [throttledCalculate, workerRequest]);

  useEffect(() => {
    return () => {
      throttledCalculate.cancel();
    };
  }, [throttledCalculate]);

  const visibleConnections = showConnections ? connections : [];

  return (
    <ConnectionsSvg
      width={width}
      height={height}
      style={{
        strokeWidth: 2 / zoomRatio,
      }}
      $isDragging={isDragging}
    >
      {visibleConnections.map((connection) => (
        <SceneConnection
          key={`m_${getConnectionId(connection)}`}
          connection={connection}
          editable={editable}
        />
      ))}
    </ConnectionsSvg>
  );
};

export default Connections;
