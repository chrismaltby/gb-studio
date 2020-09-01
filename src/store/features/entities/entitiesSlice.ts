import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  EntityState,
  ThunkDispatch,
  AnyAction,
  createSelector,
} from "@reduxjs/toolkit";
import flatten from "lodash/flatten";
import {
  SPRITE_TYPE_STATIC,
  SPRITE_TYPE_ACTOR,
  DMG_PALETTE,
} from "../../../consts";
import {
  regenerateEventIds,
  patchEvents,
  mapEvents,
  isVariableField,
  walkEvents,
} from "../../../lib/helpers/eventSystem";
import clamp from "../../../lib/helpers/clamp";
import { RootState } from "../../configureStore";
import {
  DRAG_PLAYER,
  DRAG_DESTINATION,
  DRAG_ACTOR,
  DRAG_TRIGGER,
} from "../../../reducers/editorReducer";
import { actions as settingsActions } from "../settings/settingsSlice";
import { Dictionary } from "lodash";
import uuid from "uuid";
import {
  replaceInvalidCustomEventVariables,
  replaceInvalidCustomEventActors,
} from "../../../lib/compiler/helpers";
import { EVENT_CALL_CUSTOM_EVENT } from "../../../lib/compiler/eventTypes";

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;
const MIN_SCENE_WIDTH = 20;
const MIN_SCENE_HEIGHT = 18;

type ActorDirection = "up" | "down" | "left" | "right";
type ActorSpriteType = "static" | "actor";
type SpriteType = "static" | "animated" | "actor" | "actor_animated";

type ScriptEvent = {
  id: string;
  command: string;
  args: any;
  children: Dictionary<ScriptEvent[]>;
};

type Actor = {
  id: string;
  name: string;
  x: number;
  y: number;
  spriteSheetId: string;
  spriteType: ActorSpriteType;
  frame: number;
  direction: ActorDirection;
  animate: boolean;
  script: ScriptEvent[];
  startScript: ScriptEvent[];
  hit1Script: ScriptEvent[];
  hit2Script: ScriptEvent[];
  hit3Script: ScriptEvent[];
};

type Trigger = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  script: ScriptEvent[];
};

export type Background = {
  id: string;
  name: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  _v: number;
};

export type Music = {
  id: string;
  name: string;
  filename: string;
  _v: number;
};

type Palette = {
  id: string;
  name: string;
  colors: [string, string, string, string];
  defaultName?: string;
  defaultColors?: [string, string, string, string];
};

type Variable = {
  id: string;
  name: string;
};

type CustomEventVariable = {
  id: string;
  name: string;
};

type CustomEventActor = {
  id: string;
  name: string;
};

type CustomEvent = {
  id: string;
  name: string;
  description: string;
  variables: Dictionary<CustomEventVariable>;
  actors: Dictionary<CustomEventActor>;
  script: ScriptEvent[];
};

type SpriteSheet = {
  id: string;
  name: string;
  filename: string;
  type: SpriteType;
  numFrames: number;
};

type Scene = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundId: string;
  collisions: number[];
  tileColors: number[];
  actors: string[];
  triggers: string[];
  script: ScriptEvent[];
  playerHit1Script: ScriptEvent[];
  playerHit2Script: ScriptEvent[];
  playerHit3Script: ScriptEvent[];
};

type SceneData = Omit<Scene, "actors" | "triggers"> & {
  actors: Actor[];
  triggers: Trigger[];
};

type ProjectData = {
  scenes: SceneData[];
  backgrounds: Background[];
  spriteSheets: SpriteSheet[];
  palettes: Palette[];
  customEvents: CustomEvent[];
  music: Music[];
  variables: Variable[];
};

interface EntitiesState {
  actors: EntityState<Actor>;
  triggers: EntityState<Trigger>;
  scenes: EntityState<Scene>;
  backgrounds: EntityState<Background>;
  spriteSheets: EntityState<SpriteSheet>;
  palettes: EntityState<Palette>;
  customEvents: EntityState<CustomEvent>;
  music: EntityState<Music>;
  variables: EntityState<Variable>;
}

const actorsAdapter = createEntityAdapter<Actor>();
const triggersAdapter = createEntityAdapter<Trigger>();
const scenesAdapter = createEntityAdapter<Scene>();
const backgroundsAdapter = createEntityAdapter<Background>();
const spriteSheetsAdapter = createEntityAdapter<SpriteSheet>();
const palettesAdapter = createEntityAdapter<Palette>();
const customEventsAdapter = createEntityAdapter<CustomEvent>();
const musicAdapter = createEntityAdapter<Music>();
const variablesAdapter = createEntityAdapter<Variable>();

const initialState: EntitiesState = {
  actors: actorsAdapter.getInitialState(),
  triggers: triggersAdapter.getInitialState(),
  scenes: scenesAdapter.getInitialState(),
  backgrounds: backgroundsAdapter.getInitialState(),
  spriteSheets: spriteSheetsAdapter.getInitialState(),
  palettes: palettesAdapter.getInitialState(),
  customEvents: customEventsAdapter.getInitialState(),
  music: musicAdapter.getInitialState(),
  variables: variablesAdapter.getInitialState(),
};

const moveSelectedEntity = ({
  sceneId,
  x,
  y,
}: {
  sceneId: string;
  x: number;
  y: number;
}) => (
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
  getState: () => RootState
) => {
  const state = getState();
  const { dragging, scene, eventId, entityId, type: editorType } = state.editor;
  if (dragging === DRAG_PLAYER) {
    dispatch(settingsActions.editPlayerStartAt({ sceneId, x, y }));
  } else if (dragging === DRAG_DESTINATION) {
    dispatch(
      editDestinationPosition(
        eventId,
        scene,
        editorType,
        entityId,
        sceneId,
        x,
        y
      )
    );
  } else if (dragging === DRAG_ACTOR) {
    dispatch(
      actions.moveActor({
        actorId: entityId,
        sceneId: scene,
        newSceneId: sceneId,
        x,
        y,
      })
    );
  } else if (dragging === DRAG_TRIGGER) {
    dispatch(
      actions.moveTrigger({
        sceneId: scene,
        triggerId: entityId,
        newSceneId: sceneId,
        x,
        y,
      })
    );
  }
};

const editDestinationPosition = (
  eventId: string,
  sceneId: string,
  selectionType: string,
  id: string,
  destSceneId: string,
  x: number,
  y: number
) => {
  if (selectionType === "actors") {
    return actions.editActorEventDestinationPosition({
      eventId,
      actorId: id,
      destSceneId,
      x,
      y,
    });
  }
  if (selectionType === "triggers") {
    return actions.editTriggerEventDestinationPosition({
      eventId,
      triggerId: id,
      destSceneId,
      x,
      y,
    });
  }
  return actions.editSceneEventDestinationPosition({
    eventId,
    sceneId,
    destSceneId,
    x,
    y,
  });
};

const regenerateEvents = (events: ScriptEvent[] = []): ScriptEvent[] => {
  return events.map(regenerateEventIds);
};

const mapActorEvents = (
  actor: Actor,
  fn: (event: ScriptEvent) => ScriptEvent
): Actor => {
  return {
    ...actor,
    script: mapEvents(actor.script || [], fn),
    startScript: mapEvents(actor.startScript || [], fn),
    hit1Script: mapEvents(actor.hit1Script || [], fn),
    hit2Script: mapEvents(actor.hit2Script || [], fn),
    hit3Script: mapEvents(actor.hit3Script || [], fn),
  };
};

const mapTriggerEvents = (
  trigger: Trigger,
  fn: (event: ScriptEvent) => ScriptEvent
): Trigger => {
  return {
    ...trigger,
    script: mapEvents(trigger.script || [], fn),
  };
};

const mapSceneEvents = (
  scene: Scene,
  fn: (event: ScriptEvent) => ScriptEvent
): Scene => {
  return {
    ...scene,
    script: mapEvents(scene.script || [], fn),
    playerHit1Script: mapEvents(scene.playerHit1Script || [], fn),
    playerHit2Script: mapEvents(scene.playerHit2Script || [], fn),
    playerHit3Script: mapEvents(scene.playerHit3Script || [], fn),
  };
};

const mapActorsEvents = (
  actors: Actor[],
  fn: (event: ScriptEvent) => ScriptEvent
): Actor[] => {
  return actors.map((actor) => mapActorEvents(actor, fn));
};

const mapTriggersEvents = (
  triggers: Trigger[],
  fn: (event: ScriptEvent) => ScriptEvent
): Trigger[] => {
  return triggers.map((trigger) => mapTriggerEvents(trigger, fn));
};

const mapScenesEvents = (
  scenes: Scene[],
  fn: (event: ScriptEvent) => ScriptEvent
): Scene[] => {
  return scenes.map((scene) => mapSceneEvents(scene, fn));
};

const patchCustomEventCallArgs = (
  customEventId: string,
  script: ScriptEvent[],
  variables: Dictionary<CustomEventVariable>,
  actors: Dictionary<CustomEventActor>
) => {
  const usedVariables = Object.keys(variables).map((i) => `$variable[${i}]$`);
  const usedActors = Object.keys(actors).map((i) => `$actor[${i}]$`);

  return (event: ScriptEvent): ScriptEvent => {
    if (event.command !== EVENT_CALL_CUSTOM_EVENT) {
      return event;
    }
    if (event.args.customEventId !== customEventId) {
      return event;
    }
    const newArgs = Object.assign({ ...event.args, __name: name });
    Object.keys(newArgs).forEach((k) => {
      if (
        k.startsWith("$") &&
        !usedVariables.find((v) => v === k) &&
        !usedActors.find((a) => a === k)
      ) {
        delete newArgs[k];
      }
    });
    return {
      ...event,
      args: newArgs,
      children: {
        script: [...script],
      },
    };
  };
};

const patchCustomEventCallName = (
  customEventId: string,
  name: string,
) => {
  return (event: ScriptEvent): ScriptEvent => {
    if (event.command !== EVENT_CALL_CUSTOM_EVENT) {
      return event;
    }
    if (event.args.customEventId !== customEventId) {
      return event;
    }
    return {
      ...event,
      args: {
        ...event.args,
        __name: name
      },
    };
  };
};

const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {
    loadProject: (state, action: PayloadAction<ProjectData>) => {
      const actors = flatten(
        action.payload.scenes.map((scene) => scene.actors)
      );
      const triggers = flatten(
        action.payload.scenes.map((scene) => scene.triggers)
      );
      const scenes = action.payload.scenes.map((scene) => ({
        ...scene,
        actors: scene.actors.map((actor) => actor.id),
        triggers: scene.triggers.map((trigger) => trigger.id),
      }));
      const backgrounds = action.payload.backgrounds;
      const spriteSheets = action.payload.spriteSheets;
      const palettes = action.payload.palettes;
      const music = action.payload.music;
      const customEvents = action.payload.customEvents;
      const variables = action.payload.variables;

      actorsAdapter.setAll(state.actors, actors);
      triggersAdapter.setAll(state.triggers, triggers);
      scenesAdapter.setAll(state.scenes, scenes);
      backgroundsAdapter.setAll(state.backgrounds, backgrounds);
      spriteSheetsAdapter.setAll(state.spriteSheets, spriteSheets);
      palettesAdapter.setAll(state.palettes, palettes);
      musicAdapter.setAll(state.music, music);
      customEventsAdapter.setAll(state.customEvents, customEvents);
      variablesAdapter.setAll(state.variables, variables);
    },

    /**************************************************************************
     * Scenes
     */

    addScene: (
      state,
      action: PayloadAction<{
        sceneId: string;
        x: number;
        y: number;
        defaults?: Partial<SceneData>;
      }>
    ) => {
      const scenesTotal = localSceneSelectors.selectTotal(state);
      const backgroundId = localBackgroundSelectors.selectIds(state)[0];
      const background = localBackgroundSelectors.selectById(
        state,
        backgroundId
      );

      const script = regenerateEvents(action.payload.defaults?.script);
      const playerHit1Script = regenerateEvents(
        action.payload.defaults?.playerHit1Script
      );
      const playerHit2Script = regenerateEvents(
        action.payload.defaults?.playerHit2Script
      );
      const playerHit3Script = regenerateEvents(
        action.payload.defaults?.playerHit3Script
      );

      const newScene: Scene = Object.assign(
        {
          name: `Scene ${scenesTotal + 1}`,
          backgroundId,
          width: Math.max(MIN_SCENE_WIDTH, background?.width || 0),
          height: Math.max(MIN_SCENE_HEIGHT, background?.height || 0),
          collisions: [],
          tileColors: [],
        },
        action.payload.defaults || {},
        {
          script,
          playerHit1Script,
          playerHit2Script,
          playerHit3Script,
        },
        {
          id: action.payload.sceneId,
          x: Math.max(MIN_SCENE_X, action.payload.x),
          y: Math.max(MIN_SCENE_Y, action.payload.y),
          actors: [],
          triggers: [],
        }
      );

      scenesAdapter.addOne(state.scenes, newScene);
    },

    moveScene: (
      state,
      action: PayloadAction<{ sceneId: string; x: number; y: number }>
    ) => {
      scenesAdapter.updateOne(state.scenes, {
        id: action.payload.sceneId,
        changes: {
          x: Math.max(MIN_SCENE_X, action.payload.x),
          y: Math.max(MIN_SCENE_Y, action.payload.y),
        },
      });
    },

    editScene: (
      state,
      action: PayloadAction<{ sceneId: string; changes: Partial<Scene> }>
    ) => {
      const scene = state.scenes.entities[action.payload.sceneId];
      let patch = { ...action.payload.changes };

      if (!scene) {
        return;
      }

      if (patch.backgroundId) {
        const otherScene = localSceneSelectors.selectAll(state).find((s) => {
          return s.backgroundId === patch.backgroundId;
        });

        const actors = localActorSelectors.selectEntities(state);
        const triggers = localTriggerSelectors.selectEntities(state);

        const oldBackground =
          scene && state.backgrounds.entities[scene.backgroundId];
        const background = state.backgrounds.entities[patch.backgroundId];

        if (background) {
          if (otherScene) {
            patch.collisions = otherScene.collisions;
            patch.tileColors = otherScene.tileColors;
          } else if (
            oldBackground &&
            background &&
            oldBackground.width == background.width
          ) {
            const collisionsSize = Math.ceil(
              background.width * background.height
            );
            patch.collisions = scene.collisions.slice(0, collisionsSize);
            patch.tileColors = [];
          } else if (background) {
            const collisionsSize = Math.ceil(
              background.width * background.height
            );
            patch.collisions = [];
            patch.tileColors = [];
            for (let i = 0; i < collisionsSize; i++) {
              patch.collisions[i] = 0;
            }
          }

          scene.actors.forEach((actorId) => {
            const actor = actors[actorId];
            if (actor) {
              const x = Math.min(actor.x, background.width - 2);
              const y = Math.min(actor.y, background.height - 1);
              if (actor.x !== x || actor.y !== y) {
                actorsAdapter.updateOne(state.actors, {
                  id: actor.id,
                  changes: { x, y },
                });
              }
            }
          });

          scene.triggers.forEach((triggerId) => {
            const trigger = triggers[triggerId];
            if (trigger) {
              const x = Math.min(trigger.x, background.width - 1);
              const y = Math.min(trigger.y, background.height - 1);
              const width = Math.min(trigger.width, background.width - x);
              const height = Math.min(trigger.height, background.height - y);
              if (
                trigger.x !== x ||
                trigger.y !== y ||
                trigger.width !== width ||
                trigger.height !== height
              ) {
                triggersAdapter.updateOne(state.triggers, {
                  id: trigger.id,
                  changes: { x, y, width, height },
                });
              }
            }
          });
        }
      }

      scenesAdapter.updateOne(state.scenes, {
        id: action.payload.sceneId,
        changes: patch,
      });
    },

    editSceneEventDestinationPosition: (
      state,
      action: PayloadAction<{
        sceneId: string;
        eventId: string;
        destSceneId: string;
        x: number;
        y: number;
      }>
    ) => {
      const scene = localSceneSelectors.selectById(
        state,
        action.payload.sceneId
      );
      if (!scene) {
        return;
      }
      scenesAdapter.updateOne(state.scenes, {
        id: action.payload.sceneId,
        changes: {
          script: patchEvents(scene.script, action.payload.eventId, {
            sceneId: action.payload.destSceneId,
            x: action.payload.x,
            y: action.payload.y,
          }),
        },
      });
    },

    /**************************************************************************
     * Actors
     */

    addActor: (
      state,
      action: PayloadAction<{
        actorId: string;
        sceneId: string;
        x: number;
        y: number;
        defaults?: Partial<Actor>;
      }>
    ) => {
      const scene = localSceneSelectors.selectById(
        state,
        action.payload.sceneId
      );
      if (!scene) {
        return;
      }

      const spriteSheetId = localSpriteSheetSelectors.selectAll(state)[0];
      if (!spriteSheetId) {
        return;
      }

      const script = regenerateEvents(action.payload.defaults?.script);
      const startScript = regenerateEvents(
        action.payload.defaults?.startScript
      );
      const hit1Script = regenerateEvents(action.payload.defaults?.hit1Script);
      const hit2Script = regenerateEvents(action.payload.defaults?.hit2Script);
      const hit3Script = regenerateEvents(action.payload.defaults?.hit3Script);

      const newActor: Actor = Object.assign(
        {
          name: "",
          frame: 0,
          animate: false,
          spriteSheetId,
          spriteType: SPRITE_TYPE_STATIC,
          direction: "down",
          moveSpeed: "1",
          animSpeed: "3",
        },
        action.payload.defaults || {},
        {
          script,
          startScript,
          hit1Script,
          hit2Script,
          hit3Script,
        },
        {
          id: action.payload.actorId,
          x: clamp(action.payload.x, 0, scene.width - 2),
          y: clamp(action.payload.y, 0, scene.height - 1),
        }
      );

      // Add to scene
      scenesAdapter.updateOne(state.scenes, {
        id: action.payload.sceneId,
        changes: {
          actors: ([] as string[]).concat(scene.actors, action.payload.actorId),
        },
      });

      actorsAdapter.addOne(state.actors, newActor);
    },

    editActor: (
      state,
      action: PayloadAction<{ actorId: string; changes: Partial<Actor> }>
    ) => {
      const actor = localActorSelectors.selectById(
        state,
        action.payload.actorId
      );
      let patch = { ...action.payload.changes };

      if (!actor) {
        return;
      }

      // If changed spriteSheetId
      if (patch.spriteSheetId) {
        const newSprite = localSpriteSheetSelectors.selectById(
          state,
          patch.spriteSheetId
        );

        if (newSprite) {
          // If new sprite not an actor then reset sprite type back to static
          if (newSprite.numFrames !== 3 && newSprite.numFrames !== 6) {
            patch.spriteType = SPRITE_TYPE_STATIC;
          }
          const oldSprite = localSpriteSheetSelectors.selectById(
            state,
            actor.spriteSheetId
          );
          // If new sprite is an actor and old one wasn't reset sprite type to actor
          if (
            oldSprite &&
            newSprite &&
            oldSprite.id !== newSprite.id &&
            oldSprite.numFrames !== 3 &&
            oldSprite.numFrames !== 6 &&
            (newSprite.numFrames === 3 || newSprite.numFrames === 6)
          ) {
            patch.spriteType = SPRITE_TYPE_ACTOR;
          }

          if (newSprite && newSprite.numFrames <= actor.frame) {
            patch.frame = 0;
          }
        }
      }
      // If static and cycling frames start from frame 1 (facing downwards)
      if (
        (patch.animate && actor.spriteType === SPRITE_TYPE_STATIC) ||
        patch.spriteType === SPRITE_TYPE_STATIC
      ) {
        patch.direction = "down";
      }

      actorsAdapter.updateOne(state.actors, {
        id: action.payload.actorId,
        changes: patch,
      });
    },

    moveActor: (
      state,
      action: PayloadAction<{
        actorId: string;
        sceneId: string;
        newSceneId: string;
        x: number;
        y: number;
      }>
    ) => {
      const newScene = localSceneSelectors.selectById(
        state,
        action.payload.newSceneId
      );
      if (!newScene) {
        return;
      }

      if (action.payload.sceneId !== action.payload.newSceneId) {
        const prevScene = localSceneSelectors.selectById(
          state,
          action.payload.sceneId
        );
        if (!prevScene) {
          return;
        }

        // Remove from previous scene
        scenesAdapter.updateOne(state.scenes, {
          id: action.payload.sceneId,
          changes: {
            actors: prevScene.actors.filter((actorId) => {
              return actorId !== action.payload.actorId;
            }),
          },
        });

        // Add to new scene
        scenesAdapter.updateOne(state.scenes, {
          id: action.payload.newSceneId,
          changes: {
            actors: ([] as string[]).concat(
              newScene.actors,
              action.payload.actorId
            ),
          },
        });
      }

      actorsAdapter.updateOne(state.actors, {
        id: action.payload.actorId,
        changes: {
          x: clamp(action.payload.x, 0, newScene.width - 2),
          y: clamp(action.payload.y, 0, newScene.height - 1),
        },
      });
    },

    editActorEventDestinationPosition: (
      state,
      action: PayloadAction<{
        actorId: string;
        eventId: string;
        destSceneId: string;
        x: number;
        y: number;
      }>
    ) => {
      const actor = localActorSelectors.selectById(
        state,
        action.payload.actorId
      );
      if (!actor) {
        return;
      }
      actorsAdapter.updateOne(state.actors, {
        id: action.payload.actorId,
        changes: {
          script: patchEvents(actor.script, action.payload.eventId, {
            sceneId: action.payload.destSceneId,
            x: action.payload.x,
            y: action.payload.y,
          }),
        },
      });
    },

    /**************************************************************************
     * Triggers
     */

    addTrigger: (
      state,
      action: PayloadAction<{
        triggerId: string;
        sceneId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        defaults?: Partial<Trigger>;
      }>
    ) => {
      const scene = localSceneSelectors.selectById(
        state,
        action.payload.sceneId
      );
      if (!scene) {
        return;
      }

      const width = Math.min(action.payload.width, scene.width);
      const height = Math.min(action.payload.height, scene.height);

      const script: ScriptEvent[] | undefined =
        action.payload.defaults &&
        action.payload.defaults.script &&
        action.payload.defaults.script.map(regenerateEventIds);

      const newTrigger: Trigger = Object.assign(
        {
          name: "",
          trigger: "walk",
        },
        action.payload.defaults || {},
        script && {
          script,
        },
        {
          id: action.payload.triggerId,
          x: clamp(action.payload.x, 0, scene.width - width),
          y: clamp(action.payload.y, 0, scene.height - height),
          width,
          height,
        }
      );

      // Add to scene
      scenesAdapter.updateOne(state.scenes, {
        id: action.payload.sceneId,
        changes: {
          triggers: ([] as string[]).concat(
            scene.triggers,
            action.payload.triggerId
          ),
        },
      });

      triggersAdapter.addOne(state.triggers, newTrigger);
    },

    editTrigger: (
      state,
      action: PayloadAction<{ triggerId: string; changes: Partial<Trigger> }>
    ) => {
      let patch = { ...action.payload.changes };

      triggersAdapter.updateOne(state.triggers, {
        id: action.payload.triggerId,
        changes: patch,
      });
    },

    moveTrigger: (
      state,
      action: PayloadAction<{
        triggerId: string;
        sceneId: string;
        newSceneId: string;
        x: number;
        y: number;
      }>
    ) => {
      const trigger = localTriggerSelectors.selectById(
        state,
        action.payload.triggerId
      );
      if (!trigger) {
        return;
      }

      const newScene = localSceneSelectors.selectById(
        state,
        action.payload.newSceneId
      );
      if (!newScene) {
        return;
      }

      if (action.payload.sceneId !== action.payload.newSceneId) {
        const prevScene = localSceneSelectors.selectById(
          state,
          action.payload.sceneId
        );
        if (!prevScene) {
          return;
        }

        // Remove from previous scene
        scenesAdapter.updateOne(state.scenes, {
          id: action.payload.sceneId,
          changes: {
            triggers: prevScene.triggers.filter((triggerId) => {
              return triggerId !== action.payload.triggerId;
            }),
          },
        });

        // Add to new scene
        scenesAdapter.updateOne(state.scenes, {
          id: action.payload.newSceneId,
          changes: {
            triggers: ([] as string[]).concat(
              newScene.triggers,
              action.payload.triggerId
            ),
          },
        });
      }

      triggersAdapter.updateOne(state.triggers, {
        id: action.payload.triggerId,
        changes: {
          x: clamp(action.payload.x, 0, newScene.width - trigger.width),
          y: clamp(action.payload.y, 0, newScene.height - trigger.height),
        },
      });
    },

    editTriggerEventDestinationPosition: (
      state,
      action: PayloadAction<{
        triggerId: string;
        eventId: string;
        destSceneId: string;
        x: number;
        y: number;
      }>
    ) => {
      const trigger = localTriggerSelectors.selectById(
        state,
        action.payload.triggerId
      );
      if (!trigger) {
        return;
      }
      triggersAdapter.updateOne(state.triggers, {
        id: action.payload.triggerId,
        changes: {
          script: patchEvents(trigger.script, action.payload.eventId, {
            sceneId: action.payload.destSceneId,
            x: action.payload.x,
            y: action.payload.y,
          }),
        },
      });
    },

    /**************************************************************************
     * Palettes
     */

    addPalette: {
      reducer: (state, action: PayloadAction<{ paletteId: string }>) => {
        const newPalette: Palette = {
          id: action.payload.paletteId,
          name: `Palette ${localPaletteSelectors.selectTotal(state) + 1}`,
          colors: [
            DMG_PALETTE.colors[0],
            DMG_PALETTE.colors[1],
            DMG_PALETTE.colors[2],
            DMG_PALETTE.colors[3],
          ],
        };
        palettesAdapter.addOne(state.palettes, newPalette);
      },
      prepare: () => {
        return {
          payload: {
            paletteId: uuid(),
          },
        };
      },
    },

    editPalette: (
      state,
      action: PayloadAction<{ paletteId: string; changes: Partial<Palette> }>
    ) => {
      let patch = { ...action.payload.changes };

      palettesAdapter.updateOne(state.palettes, {
        id: action.payload.paletteId,
        changes: patch,
      });
    },

    removePalette: (state, action: PayloadAction<string>) => {
      palettesAdapter.removeOne(state.palettes, action.payload);
    },

    /**************************************************************************
     * Custom Events
     */

    editCustomEvent: (
      state,
      action: PayloadAction<{
        customEventId: string;
        changes: Partial<CustomEvent>;
      }>
    ) => {
      const oldEvent =
        state.customEvents.entities[action.payload.customEventId];

      let patch = { ...action.payload.changes };

      if (!oldEvent) {
        return;
      }

      if (patch.script) {
        // Fix invalid variables in script
        const fix = replaceInvalidCustomEventVariables;
        const fixActor = replaceInvalidCustomEventActors;
        patch.script = mapEvents(patch.script, (event: ScriptEvent) => {
          if (event.args) {
            const fixedEventVariableArgs = Object.keys(event.args).reduce(
              (memo, arg) => {
                const fixedVarArgs = memo;
                if (isVariableField(event.command, arg, event.args[arg])) {
                  fixedVarArgs[arg] = fix(event.args[arg]);
                } else {
                  fixedVarArgs[arg] = event.args[arg];
                }
                return fixedVarArgs;
              },
              {} as Dictionary<any>
            );

            return {
              ...event,
              args: {
                ...event.args,
                ...fixedEventVariableArgs,
                actorId: event.args.actorId && fixActor(event.args.actorId),
                otherActorId:
                  event.args.otherActorId && fixActor(event.args.otherActorId),
              },
            };
          }
          return event;
        });

        const variables = {} as Dictionary<CustomEventVariable>;
        const actors = {} as Dictionary<CustomEventActor>;

        const oldVariables = oldEvent ? oldEvent.variables : {};
        const oldActors = oldEvent ? oldEvent.actors : {};

        walkEvents(patch.script, (e: ScriptEvent) => {
          const args = e.args;

          if (!args) return;

          if (args.actorId && args.actorId !== "player") {
            const letter = String.fromCharCode(
              "A".charCodeAt(0) + parseInt(args.actorId)
            );
            actors[args.actorId] = {
              id: args.actorId,
              name: oldActors[args.actorId]
                ? oldActors[args.actorId].name
                : `Actor ${letter}`,
            };
          }

          if (args.otherActorId && args.otherActorId !== "player") {
            const letter = String.fromCharCode(
              "A".charCodeAt(0) + parseInt(args.otherActorId)
            );
            actors[args.otherActorId] = {
              id: args.otherActorId,
              name: oldActors[args.otherActorId]
                ? oldActors[args.otherActorId].name
                : `Actor ${letter}`,
            };
          }

          Object.keys(args).forEach((arg) => {
            if (isVariableField(e.command, arg, args[arg])) {
              const addVariable = (variable: string) => {
                const letter = String.fromCharCode(
                  "A".charCodeAt(0) + parseInt(variable)
                );
                variables[variable] = {
                  id: variable,
                  name: oldVariables[variable]
                    ? oldVariables[variable].name
                    : `Variable ${letter}`,
                };
              };
              const variable = args[arg];
              if (variable != null && variable.type === "variable") {
                addVariable(variable.value);
              } else {
                addVariable(variable);
              }
            }
          });

          if (args.text) {
            const text = Array.isArray(args.text)
              ? args.text.join()
              : args.text;
            const variablePtrs = text.match(/\$V[0-9]\$/g);
            if (variablePtrs) {
              variablePtrs.forEach((variablePtr: string) => {
                const variable = variablePtr[2];
                const letter = String.fromCharCode(
                  "A".charCodeAt(0) + parseInt(variable, 10)
                ).toUpperCase();
                variables[variable] = {
                  id: variable,
                  name: oldVariables[variable]
                    ? oldVariables[variable].name
                    : `Variable ${letter}`,
                };
              });
            }
          }
        });

        patch.variables = { ...variables };
        patch.actors = { ...actors };

        const patchEventCallFn = patchCustomEventCallArgs(action.payload.customEventId, patch.script, patch.variables, patch.actors);
        const patchedActors = mapActorsEvents(localActorSelectors.selectAll(state), patchEventCallFn);
        const patchedTriggers = mapTriggersEvents(localTriggerSelectors.selectAll(state), patchEventCallFn);
        const patchedScenes = mapScenesEvents(localSceneSelectors.selectAll(state), patchEventCallFn);
        actorsAdapter.setAll(state.actors, patchedActors);
        triggersAdapter.setAll(state.triggers, patchedTriggers);
        scenesAdapter.setAll(state.scenes, patchedScenes);
      }

      if (patch.name) {
       const patchEventCallFn = patchCustomEventCallName(action.payload.customEventId, patch.name);
       const patchedActors = mapActorsEvents(localActorSelectors.selectAll(state), patchEventCallFn);
       const patchedTriggers = mapTriggersEvents(localTriggerSelectors.selectAll(state), patchEventCallFn);
       const patchedScenes = mapScenesEvents(localSceneSelectors.selectAll(state), patchEventCallFn);
       actorsAdapter.setAll(state.actors, patchedActors);
       triggersAdapter.setAll(state.triggers, patchedTriggers);
       scenesAdapter.setAll(state.scenes, patchedScenes);
      }

      customEventsAdapter.updateOne(state.customEvents, {
        id: action.payload.customEventId,
        changes: patch,
      });
    },
  },
});

export const { reducer } = entitiesSlice;

export const actions = {
  ...entitiesSlice.actions,
  moveSelectedEntity,
  editDestinationPosition,
};

export const { loadProject, editScene, editActor, addPalette } = actions;

const localActorSelectors = actorsAdapter.getSelectors(
  (state: EntitiesState) => state.actors
);
const localTriggerSelectors = triggersAdapter.getSelectors(
  (state: EntitiesState) => state.triggers
);
const localSceneSelectors = scenesAdapter.getSelectors(
  (state: EntitiesState) => state.scenes
);
const localSpriteSheetSelectors = spriteSheetsAdapter.getSelectors(
  (state: EntitiesState) => state.spriteSheets
);
const localBackgroundSelectors = backgroundsAdapter.getSelectors(
  (state: EntitiesState) => state.backgrounds
);
const localPaletteSelectors = palettesAdapter.getSelectors(
  (state: EntitiesState) => state.palettes
);
const localCustomEventSelectors = customEventsAdapter.getSelectors(
  (state: EntitiesState) => state.customEvents
);

export const actorSelectors = actorsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.actors
);
export const triggerSelectors = triggersAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.triggers
);
export const sceneSelectors = scenesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.scenes
);
export const spriteSheetSelectors = spriteSheetsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.spriteSheets
);
export const backgroundSelectors = backgroundsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.backgrounds
);
export const paletteSelectors = palettesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.palettes
);
export const customEventSelectors = customEventsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.customEvents
);
export const musicSelectors = musicAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.music
);
export const variableSelectors = variablesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.variables
);

export const getMaxSceneRight = createSelector(
  [sceneSelectors.selectAll],
  (scenes) =>
    scenes.reduce((memo, scene) => {
      const sceneRight = scene.x + scene.width * 8;
      if (sceneRight > memo) {
        return sceneRight;
      }
      return memo;
    }, 0)
);

export const getMaxSceneBottom = createSelector(
  [sceneSelectors.selectAll],
  (scenes) =>
    scenes.reduce((memo, scene) => {
      const sceneBottom = scene.y + scene.height * 8;
      if (sceneBottom > memo) {
        return sceneBottom;
      }
      return memo;
    }, 0)
);

export const getSceneActorIds = (state: RootState, { id }: { id: string }) =>
  sceneSelectors.selectById(state, id)?.actors;

export default reducer;
