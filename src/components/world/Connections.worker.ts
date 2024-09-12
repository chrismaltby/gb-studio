import { EVENT_SWITCH_SCENE, MAX_NESTED_SCRIPT_DEPTH } from "consts";
import {
  SceneNormalized,
  ScriptEventNormalized,
  ActorNormalized,
  TriggerNormalized,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
  CustomEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  ActorDirection,
  ShowConnectionsSetting,
} from "shared/lib/resources/types";
import {
  walkNormalizedSceneSpecificScripts,
  walkNormalizedActorScripts,
  walkNormalizedTriggerScripts,
} from "shared/lib/scripts/walk";
import { optimiseScriptValue } from "shared/lib/scriptValue/helpers";
import { ensureScriptValue } from "shared/lib/scriptValue/types";

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

export interface ConnectionsWorkerRequest {
  scenes: SceneNormalized[];
  showConnections: ShowConnectionsSetting;
  selectedSceneId: string;
  eventsLookup: Record<string, ScriptEventNormalized>;
  scenesLookup: Record<string, SceneNormalized>;
  actorsLookup: Record<string, ActorNormalized>;
  triggersLookup: Record<string, TriggerNormalized>;
  actorPrefabsLookup: Record<string, ActorPrefabNormalized>;
  triggerPrefabsLookup: Record<string, TriggerPrefabNormalized>;
  customEventsLookup: Record<string, CustomEventNormalized>;
}

export interface ConnectionsWorkerResult {
  connections: TransitionCoords[];
}

export interface TransitionCoords {
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
  eventsLookup: Record<string, ScriptEventNormalized>,
  scenesLookup: Record<string, SceneNormalized>,
  actorsLookup: Record<string, ActorNormalized>,
  triggersLookup: Record<string, TriggerNormalized>,
  actorPrefabsLookup: Record<string, ActorPrefabNormalized>,
  triggerPrefabsLookup: Record<string, TriggerPrefabNormalized>,
  customEventsLookup: Record<string, CustomEventNormalized>
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

workerCtx.onmessage = async (evt) => {
  const data = evt.data as ConnectionsWorkerRequest;
  const {
    scenes,
    showConnections,
    selectedSceneId,
    eventsLookup,
    scenesLookup,
    actorsLookup,
    triggersLookup,
    actorPrefabsLookup,
    triggerPrefabsLookup,
    customEventsLookup,
  } = data;

  const connections = scenes
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
    .flat();

  workerCtx.postMessage({ connections });
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
