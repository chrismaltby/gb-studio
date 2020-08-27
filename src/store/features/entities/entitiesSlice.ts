import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  EntityState,
} from "@reduxjs/toolkit";
import flatten from "lodash/flatten";

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;

type Actor = { id: string; name: string; x: number; y: number };
type Trigger = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
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

type Scene = {
  name: string;
  x: number;
  y: number;
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
};

interface EntitiesState {
  actors: EntityState<Actor>;
  triggers: EntityState<Trigger>;
  scenes: EntityState<Scene>;
  backgrounds: EntityState<Background>;
}

const actorsAdapter = createEntityAdapter<Actor>();
const triggersAdapter = createEntityAdapter<Trigger>();
const scenesAdapter = createEntityAdapter<Scene>();
const backgroundsAdapter = createEntityAdapter<Background>();

const initialState: EntitiesState = {
  actors: actorsAdapter.getInitialState(),
  triggers: triggersAdapter.getInitialState(),
  scenes: scenesAdapter.getInitialState(),
  backgrounds: backgroundsAdapter.getInitialState(),
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

      actorsAdapter.setAll(state.actors, actors);
      triggersAdapter.setAll(state.triggers, triggers);
      scenesAdapter.setAll(state.scenes, scenes);
      backgroundsAdapter.setAll(state.backgrounds, backgrounds);
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
  },
});

export const { actions, reducer } = entitiesSlice;
export const { loadProject, editScene } = actions;
export const actorSelectors = actorsAdapter.getSelectors(
  (state: EntitiesState) => state.actors
);
export const triggerSelectors = triggersAdapter.getSelectors(
  (state: EntitiesState) => state.triggers
);
export const sceneSelectors = scenesAdapter.getSelectors(
  (state: EntitiesState) => state.scenes
);

export default reducer;
