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
import styled from "styled-components";
import {
  useAppDispatch,
  useAppSelector,
  useAppSelectorPick,
  useAppStore,
} from "store/hooks";
import ConnectionsWorker, {
  ConnectionsWorkerRequest,
  ConnectionsWorkerResult,
  SceneTransitionCoords,
} from "./Connections.worker";
import throttle from "lodash/throttle";
import { optimiseScriptValue } from "shared/lib/scriptValue/helpers";
import { ensureScriptValue } from "shared/lib/scriptValue/types";
import { ActorDirection } from "shared/lib/resources/types";
import type { RootState } from "store/storeTypes";

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
  connection: SceneTransitionCoords;
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

const defaultCoord = {
  type: "number",
  value: 0,
} as const;

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

const lookupValues = <T,>(lookup: Record<string, T | undefined>) =>
  Object.values(lookup).filter((value): value is T => value !== undefined);

const omitObjectKeys = <T extends object>(value: T, keys: string[]) => {
  const copy = { ...value };

  keys.forEach((key) => {
    delete (copy as Record<string, unknown>)[key];
  });

  return copy;
};

const normaliseScriptEventForTopology = (event: object) => {
  const copy = { ...event } as Record<string, unknown>;

  if (copy.args && typeof copy.args === "object" && !Array.isArray(copy.args)) {
    const args = { ...(copy.args as Record<string, unknown>) };

    // These affect the rendered geometry of an existing connection, not
    // whether the connection exists. SceneConnection reads them directly.
    delete args.x;
    delete args.y;
    delete args.direction;

    copy.args = args;
  }

  return copy;
};

const selectConnectionTopologyKey = (state: RootState) => {
  const showConnections = state.project.present.settings.showConnections;

  return JSON.stringify({
    showConnections,
    selectedSceneId: showConnections === "all" ? "" : state.editor.scene,

    scenes: lookupValues(sceneSelectors.selectEntities(state)).map((scene) =>
      omitObjectKeys(scene, ["x", "y", "width", "height", "scrollBounds"]),
    ),

    actors: lookupValues(actorSelectors.selectEntities(state)).map((actor) =>
      omitObjectKeys(actor, ["x", "y"]),
    ),

    triggers: lookupValues(triggerSelectors.selectEntities(state)).map(
      (trigger) => omitObjectKeys(trigger, ["x", "y", "width", "height"]),
    ),

    events: lookupValues(scriptEventSelectors.selectEntities(state)).map(
      normaliseScriptEventForTopology,
    ),

    customEvents: lookupValues(customEventSelectors.selectEntities(state)),
    actorPrefabs: lookupValues(actorPrefabSelectors.selectEntities(state)),
    triggerPrefabs: lookupValues(triggerPrefabSelectors.selectEntities(state)),
  });
};

const buildConnectionsWorkerRequest = (
  state: RootState,
): ConnectionsWorkerRequest => ({
  showConnections: state.project.present.settings.showConnections,
  selectedSceneId: state.editor.scene,
  scenes: sceneSelectors.selectAll(state),
  eventsLookup: scriptEventSelectors.selectEntities(state),
  scenesLookup: sceneSelectors.selectEntities(state),
  actorsLookup: actorSelectors.selectEntities(state),
  triggersLookup: triggerSelectors.selectEntities(state),
  actorPrefabsLookup: actorPrefabSelectors.selectEntities(state),
  triggerPrefabsLookup: triggerPrefabSelectors.selectEntities(state),
  customEventsLookup: customEventSelectors.selectEntities(state),
});

const getConnectionId = (connection: SceneTransitionCoords) =>
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
  connection: SceneTransitionCoords,
): ConnectionGeometry | undefined => {
  const fromScene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, connection.fromSceneId),
    ["x", "y"],
  );

  const scriptEvent = useAppSelectorPick(
    (state) => scriptEventSelectors.selectById(state, connection.eventId),
    ["args", "command"],
  );

  const toSceneId =
    scriptEvent?.command === EVENT_SWITCH_SCENE
      ? String(scriptEvent.args?.sceneId || "")
      : connection.toSceneId;

  const toScene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, toSceneId),
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

    const scriptEventX = optimiseScriptValue(
      ensureScriptValue(scriptEvent.args?.x, defaultCoord),
    );
    const scriptEventY = optimiseScriptValue(
      ensureScriptValue(scriptEvent.args?.y, defaultCoord),
    );

    const toX = scriptEventX.type === "number" ? scriptEventX.value : 0;
    const toY = scriptEventY.type === "number" ? scriptEventY.value : 0;

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
    const x2 = toScene.x + toX * 8 + 5;
    const y1 = 20 + fromScene.y + (entityY + entityHeight / 2) * 8;
    const y2 = 20 + toScene.y + toY * 8 + 5;

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
      direction: scriptEvent.args?.direction as ActorDirection | undefined,
    };
  }, [actor, connection.type, fromScene, scriptEvent, toScene, trigger]);
};

const SceneConnection = memo(
  ({ connection, editable }: SceneConnectionProps) => {
    const geometry = useConnectionGeometry(connection);

    if (!geometry) {
      return null;
    }

    console.log("UPDATE SceneConnection", geometry.x1);

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
  const [connections, setConnections] = useState<SceneTransitionCoords[]>([]);

  const showConnections = useAppSelector(
    (state) => state.project.present.settings.showConnections,
  );

  const connectionTopologyKey = useAppSelector(selectConnectionTopologyKey);

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
    worker.postMessage(buildConnectionsWorkerRequest(state));
  }, [store]);

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
  }, [connectionTopologyKey, throttledCalculate]);

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
