import { EVENT_SWITCH_SCENE, MAX_NESTED_SCRIPT_DEPTH } from "consts";
import uniqBy from "lodash/uniqBy";
import {
  ActorDirection,
  ShowConnectionsSetting,
} from "shared/lib/resources/types";
import { optimiseScriptValue } from "shared/lib/scriptValue/helpers";
import { ensureScriptValue } from "shared/lib/scriptValue/types";

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

type ConnectionType = "actor" | "trigger" | "scene";

export interface ConnectionScriptEvent {
  id: string;
  command: string;
  sceneId?: string;
  customEventId?: string;
  x?: unknown;
  y?: unknown;
  direction?: ActorDirection;
  commented?: boolean;
  children?: string[][];
}

export interface ConnectionScriptSource {
  id: string;
  scripts: string[][];
  overrides?: Record<
    string,
    {
      sceneId?: string;
      customEventId?: string;
      x?: unknown;
      y?: unknown;
      direction?: ActorDirection;
    }
  >;
}

export interface ConnectionScene extends ConnectionScriptSource {
  actors: ConnectionScriptSource[];
  triggers: ConnectionScriptSource[];
}

export interface ConnectionsWorkerRequest {
  scenes: ConnectionScene[];
  sceneIds: string[];
  showConnections: ShowConnectionsSetting;
  selectedSceneId: string;
  events: Record<string, ConnectionScriptEvent>;
  customEvents: Record<string, string[]>;
}

export interface ConnectionsWorkerResult {
  connections: SceneTransition[];
}

export interface SceneTransition {
  type: ConnectionType;
  eventId: string;
  fromSceneId: string;
  toSceneId: string;
  entityId: string;
  toX: number;
  toY: number;
  direction?: ActorDirection;
}

interface WalkOptions {
  depth: number;
  overrides?: ConnectionScriptSource["overrides"];
  visitedCustomEvents: Set<string>;
}

const defaultCoord = {
  type: "number",
  value: 0,
} as const;

const eventDestinationCoord = (value: unknown): number => {
  const scriptValue = optimiseScriptValue(
    ensureScriptValue(value, defaultCoord),
  );
  return scriptValue.type === "number" ? scriptValue.value : 0;
};

const walkScript = (
  script: string[],
  events: ConnectionsWorkerRequest["events"],
  customEvents: ConnectionsWorkerRequest["customEvents"],
  options: WalkOptions,
  callback: (
    event: ConnectionScriptEvent,
    resolvedArgs: {
      sceneId?: string;
      x?: unknown;
      y?: unknown;
      direction?: ActorDirection;
    },
  ) => void,
) => {
  for (const eventId of script) {
    const event = events[eventId];
    if (!event || event.commented) {
      continue;
    }

    const override = options.overrides?.[event.id];
    callback(event, {
      sceneId: override?.sceneId ?? event.sceneId,
      x: override?.x ?? event.x,
      y: override?.y ?? event.y,
      direction: override?.direction ?? event.direction,
    });

    if (event.command !== "EVENT_CALL_CUSTOM_EVENT") {
      event.children?.forEach((child) =>
        walkScript(child, events, customEvents, options, callback),
      );
      continue;
    }

    const customEventId = override?.customEventId ?? event.customEventId;
    const customScript = customEventId && customEvents[customEventId];
    if (
      customScript &&
      options.depth >= 0 &&
      !options.visitedCustomEvents.has(customEventId)
    ) {
      const visitedCustomEvents = new Set(options.visitedCustomEvents);
      visitedCustomEvents.add(customEventId);
      walkScript(
        customScript,
        events,
        customEvents,
        {
          ...options,
          depth: options.depth - 1,
          visitedCustomEvents,
        },
        callback,
      );
    }
  }
};

const getSceneConnections = (
  request: ConnectionsWorkerRequest,
  scene: ConnectionScene,
  validSceneIds: Set<string>,
) => {
  const connections: SceneTransition[] = [];

  const walkSource = (source: ConnectionScriptSource, type: ConnectionType) => {
    source.scripts.forEach((script) =>
      walkScript(
        script,
        request.events,
        request.customEvents,
        {
          depth: MAX_NESTED_SCRIPT_DEPTH,
          overrides: source.overrides,
          visitedCustomEvents: new Set(),
        },
        (event, destination) => {
          if (
            event.command !== EVENT_SWITCH_SCENE ||
            !destination.sceneId ||
            !validSceneIds.has(destination.sceneId)
          ) {
            return;
          }

          if (
            request.showConnections === "all" ||
            scene.id === request.selectedSceneId ||
            destination.sceneId === request.selectedSceneId
          ) {
            connections.push({
              type,
              eventId: event.id,
              fromSceneId: scene.id,
              toSceneId: destination.sceneId,
              entityId: type === "scene" ? "" : source.id,
              toX: eventDestinationCoord(destination.x),
              toY: eventDestinationCoord(destination.y),
              direction: destination.direction,
            });
          }
        },
      ),
    );
  };

  walkSource(scene, "scene");
  scene.actors.forEach((actor) => walkSource(actor, "actor"));
  scene.triggers.forEach((trigger) => walkSource(trigger, "trigger"));

  return connections;
};

export const calculateConnections = (request: ConnectionsWorkerRequest) => {
  const validSceneIds = new Set(request.sceneIds);
  const connections = request.scenes.flatMap((scene) =>
    getSceneConnections(request, scene, validSceneIds),
  );

  return uniqBy(
    connections,
    (connection) =>
      `${connection.fromSceneId}_${connection.entityId}_${connection.eventId}`,
  );
};

workerCtx.onmessage = (evt) => {
  const request = evt.data as ConnectionsWorkerRequest;
  // Multiple calls to the same custom event from one source should not draw
  // multiple overlapping lines.
  workerCtx.postMessage({
    connections: calculateConnections(request),
  } satisfies ConnectionsWorkerResult);
};
