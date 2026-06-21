/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import { dummySceneNormalized, dummyNoteResource } from "../../../../dummydata";

describe("moveWorldEntities", () => {
  test("Should be able to move a single scene", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
    };

    const action = actions.moveWorldEntities({
      entityId: "scene1",
      x: 310,
      y: 520,
      additionalEntityIds: [],
    });

    const newState = reducer(state, action);
    expect(newState.scenes.entities["scene1"]?.x).toBe(310);
    expect(newState.scenes.entities["scene1"]?.y).toBe(520);
  });

  test("Should be able to move a single note", () => {
    const state: EntitiesState = {
      ...initialState,
      notes: {
        entities: {
          note1: {
            ...dummyNoteResource,
            id: "note1",
          },
        },
        ids: ["note1"],
      },
    };

    const action = actions.moveWorldEntities({
      entityId: "note1",
      x: 310,
      y: 520,
      additionalEntityIds: [],
    });

    const newState = reducer(state, action);
    expect(newState.notes.entities["note1"]?.x).toBe(310);
    expect(newState.notes.entities["note1"]?.y).toBe(520);
  });

  test("Should be able to move multiple selected entities together", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            actors: [],
            triggers: [],
            x: 100,
            y: 100,
          },
          scene2: {
            ...dummySceneNormalized,
            id: "scene2",
            actors: [],
            triggers: [],
            x: 200,
            y: 100,
          },
          scene3: {
            ...dummySceneNormalized,
            id: "scene3",
            actors: [],
            triggers: [],
            x: 100,
            y: 100,
          },
        },
        ids: ["scene1", "scene2", "scene3"],
      },
      notes: {
        entities: {
          note1: {
            ...dummyNoteResource,
            id: "note1",
            x: 100,
            y: 200,
          },
        },
        ids: ["note1"],
      },
    };

    const action = actions.moveWorldEntities({
      entityId: "scene1",
      x: 180,
      y: 150,
      additionalEntityIds: ["scene2", "note1"],
    });

    const newState = reducer(state, action);
    // Main selection moves exactly to new location
    expect(newState.scenes.entities["scene1"]?.x).toBe(180);
    expect(newState.scenes.entities["scene1"]?.y).toBe(150);

    // Additional selected entities move by the main selection's delta
    expect(newState.scenes.entities["scene2"]?.x).toBe(280);
    expect(newState.scenes.entities["scene2"]?.y).toBe(150);
    expect(newState.notes.entities["note1"]?.x).toBe(180);
    expect(newState.notes.entities["note1"]?.y).toBe(250);

    // Unselected scene3 should remain unchanged
    expect(newState.scenes.entities["scene3"]).toBe(
      state.scenes.entities["scene3"],
    );
  });
});
