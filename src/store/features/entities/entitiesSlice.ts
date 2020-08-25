import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  EntityState,
} from "@reduxjs/toolkit";
import flatten from "lodash/flatten";

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;

type Actor = { id: string; name: string };
type Trigger = { id: string; name: string };

type Scene = {
  name: string;
  x: number;
  y: number;
  actors: string[];
  triggers: string[];
};

type SceneData = {
  name: string;
  x: number;
  y: number;
  actors: Actor[];
  triggers: Trigger[];
};

type ProjectData = {
  scenes: SceneData[];
};

interface EntitiesState {
  actors: EntityState<Actor>;
  triggers: EntityState<Trigger>;
  scenes: EntityState<Scene>;
}

const actorsAdapter = createEntityAdapter<Actor>();
const triggersAdapter = createEntityAdapter<Trigger>();
const scenesAdapter = createEntityAdapter<Scene>();

const initialState: EntitiesState = {
  actors: actorsAdapter.getInitialState(),
  triggers: triggersAdapter.getInitialState(),
  scenes: scenesAdapter.getInitialState(),
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
      actorsAdapter.setAll(state.actors, actors);
      triggersAdapter.setAll(state.triggers, triggers);
      scenesAdapter.setAll(state.scenes, scenes);
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
  },
});

export const { actions, reducer } = entitiesSlice;
export const { loadProject } = actions;
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
