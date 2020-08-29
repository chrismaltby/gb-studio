import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  EntityState,
} from "@reduxjs/toolkit";
import flatten from "lodash/flatten";
import { SPRITE_TYPE_STATIC, SPRITE_TYPE_ACTOR } from "../../../consts";
import { regenerateEventIds } from "../../../lib/helpers/eventSystem";
import clamp from "../../../lib/helpers/clamp";

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;

type ActorDirection = "up" | "down" | "left" | "right";
type ActorSpriteType = "static" | "actor";
type SpriteType = "static" | "animated" | "actor" | "actor_animated";

type ScriptEvent = {
  id: string;
  command: string;
  args: any;
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

type Background = {
  id: string;
  name: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
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
};

type SceneData = Omit<Scene, "actors" | "triggers"> & {
  actors: Actor[];
  triggers: Trigger[];
};

type ProjectData = {
  scenes: SceneData[];
  backgrounds: Background[];
  spriteSheets: SpriteSheet[];
};

interface EntitiesState {
  actors: EntityState<Actor>;
  triggers: EntityState<Trigger>;
  scenes: EntityState<Scene>;
  backgrounds: EntityState<Background>;
  spriteSheets: EntityState<SpriteSheet>;
}

const actorsAdapter = createEntityAdapter<Actor>();
const triggersAdapter = createEntityAdapter<Trigger>();
const scenesAdapter = createEntityAdapter<Scene>();
const backgroundsAdapter = createEntityAdapter<Background>();
const spriteSheetsAdapter = createEntityAdapter<SpriteSheet>();

const initialState: EntitiesState = {
  actors: actorsAdapter.getInitialState(),
  triggers: triggersAdapter.getInitialState(),
  scenes: scenesAdapter.getInitialState(),
  backgrounds: backgroundsAdapter.getInitialState(),
  spriteSheets: spriteSheetsAdapter.getInitialState(),
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

      actorsAdapter.setAll(state.actors, actors);
      triggersAdapter.setAll(state.triggers, triggers);
      scenesAdapter.setAll(state.scenes, scenes);
      backgroundsAdapter.setAll(state.backgrounds, backgrounds);
      spriteSheetsAdapter.setAll(state.spriteSheets, spriteSheets);
    },

    /**************************************************************************
     * Scenes
     */

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
        const otherScene = sceneSelectors.selectAll(state).find((s) => {
          return s.backgroundId === patch.backgroundId;
        });

        const actors = actorSelectors.selectEntities(state);
        const triggers = triggerSelectors.selectEntities(state);

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
      const scene = sceneSelectors.selectById(state, action.payload.sceneId);
      if (!scene) {
        return;
      }

      const spriteSheetId = spriteSheetSelectors.selectAll(state)[0];
      if (!spriteSheetId) {
        return;
      }

      const regenerateEvents = (events: ScriptEvent[] = []): ScriptEvent[] => {
        return events.map(regenerateEventIds);
      }

      const script = regenerateEvents(action.payload.defaults?.script);
      const startScript = regenerateEvents(action.payload.defaults?.startScript);
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
      const actor = actorSelectors.selectById(state, action.payload.actorId);
      let patch = { ...action.payload.changes };

      if (!actor) {
        return;
      }

      // If changed spriteSheetId
      if (patch.spriteSheetId) {
        const newSprite = spriteSheetSelectors.selectById(
          state,
          patch.spriteSheetId
        );

        if (newSprite) {
          // If new sprite not an actor then reset sprite type back to static
          if (newSprite.numFrames !== 3 && newSprite.numFrames !== 6) {
            patch.spriteType = SPRITE_TYPE_STATIC;
          }
          const oldSprite = spriteSheetSelectors.selectById(
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
      const scene = sceneSelectors.selectById(state, action.payload.sceneId);
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
  },
});

export const { actions, reducer } = entitiesSlice;
export const { loadProject, editScene, editActor } = actions;

export const actorSelectors = actorsAdapter.getSelectors(
  (state: EntitiesState) => state.actors
);
export const triggerSelectors = triggersAdapter.getSelectors(
  (state: EntitiesState) => state.triggers
);
export const sceneSelectors = scenesAdapter.getSelectors(
  (state: EntitiesState) => state.scenes
);
export const spriteSheetSelectors = spriteSheetsAdapter.getSelectors(
  (state: EntitiesState) => state.spriteSheets
);

export default reducer;
