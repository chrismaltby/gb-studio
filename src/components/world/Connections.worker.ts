import { EVENT_SWITCH_SCENE, MAX_NESTED_SCRIPT_DEPTH } from "consts";
import { uniqBy } from "lodash";
import {
  SceneNormalized,
  ScriptEventNormalized,
  ActorNormalized,
  TriggerNormalized,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
  ScriptNormalized,
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
  customEventsLookup: Record<string, ScriptNormalized>;
}

export interface ConnectionsWorkerResult {
  connections: SceneTransitionCoords[];
}

export interface SceneTransitionCoords {
  toX: number;
  toY: number;
  type: "actor" | "trigger" | "scene";
  eventId: string;
  fromSceneId: string;
  toSceneId: string;
  entityId: string;
  direction: ActorDirection;
}

interface CalculateTransitionCoordsProps {
  type: "actor" | "trigger" | "scene";
  scriptEvent: ScriptEventNormalized;
  scene: SceneNormalized;
  destScene: SceneNormalized;
  entityId: string;
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
}: CalculateTransitionCoordsProps): SceneTransitionCoords => {
  const scriptEventX = optimiseScriptValue(
    ensureScriptValue(scriptEvent.args?.x, defaultCoord),
  );
  const scriptEventY = optimiseScriptValue(
    ensureScriptValue(scriptEvent.args?.y, defaultCoord),
  );

  const toX = scriptEventX.type === "number" ? scriptEventX.value : 0;
  const toY = scriptEventY.type === "number" ? scriptEventY.value : 0;

  return {
    toX,
    toY,
    type,
    eventId: scriptEvent.id,
    fromSceneId: scene.id,
    toSceneId: destScene.id,
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
  customEventsLookup: Record<string, ScriptNormalized>,
) => {
  const ifMatches = (
    scriptEvent: ScriptEventNormalized,
    callback: (destScene: SceneNormalized) => void,
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

  const connections: SceneTransitionCoords[] = [];
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
          }),
        );
      });
    },
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
              }),
            );
          });
        },
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
              }),
            );
          });
        },
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
        customEventsLookup,
      ),
    )
    .flat();

  // Get unique connections by sceneId+entityId+eventId so multiple calls
  // to custom scripts from the same source don't draw multiple overlapping lines
  const uniqConnections = uniqBy(
    connections,
    (connection) =>
      `${connection.fromSceneId}_${connection.entityId}_${connection.eventId}`,
  );

  workerCtx.postMessage({ connections: uniqConnections });
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
