import { EVENT_SWITCH_SCENE, MAX_NESTED_SCRIPT_DEPTH } from "consts";
import uniqBy from "lodash/uniqBy";
import { ShowConnectionsSetting } from "shared/lib/resources/types";

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

type ConnectionType = "actor" | "trigger" | "scene";

export interface ConnectionScriptEvent {
  id: string;
  command: string;
  sceneId?: string;
  customEventId?: string;
  commented?: boolean;
  children?: string[][];
}

export interface ConnectionScriptSource {
  id: string;
  scripts: string[][];
  overrides?: Record<string, { sceneId?: string; customEventId?: string }>;
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
}

interface WalkOptions {
  depth: number;
  overrides?: ConnectionScriptSource["overrides"];
  visitedCustomEvents: Set<string>;
}

const walkScript = (
  script: string[],
  events: ConnectionsWorkerRequest["events"],
  customEvents: ConnectionsWorkerRequest["customEvents"],
  options: WalkOptions,
  callback: (event: ConnectionScriptEvent, sceneId?: string) => void,
) => {
  for (const eventId of script) {
    const event = events[eventId];
    if (!event || event.commented) {
      continue;
    }

    const override = options.overrides?.[event.id];
    callback(event, override?.sceneId ?? event.sceneId);

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
        (event, destinationSceneId) => {
          if (
            event.command !== EVENT_SWITCH_SCENE ||
            !destinationSceneId ||
            !validSceneIds.has(destinationSceneId)
          ) {
            return;
          }

          if (
            request.showConnections === "all" ||
            scene.id === request.selectedSceneId ||
            destinationSceneId === request.selectedSceneId
          ) {
            connections.push({
              type,
              eventId: event.id,
              fromSceneId: scene.id,
              toSceneId: destinationSceneId,
              entityId: type === "scene" ? "" : source.id,
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

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
