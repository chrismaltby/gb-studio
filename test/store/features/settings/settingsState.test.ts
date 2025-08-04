import reducer, {
  initialState,
  SettingsState,
  getSettings,
} from "../../../../src/store/features/settings/settingsState";
import actions from "../../../../src/store/features/settings/settingsActions";
import projectActions from "../../../../src/store/features/project/projectActions";
import {
  dummyCompressedProjectResources,
  dummyRootState,
} from "../../../dummydata";
import { RootState } from "../../../../src/store/configureStore";
import { CompressedProjectResources } from "shared/lib/resources/types";

test("Should be able to change settings", () => {
  const state: SettingsState = {
    ...initialState,
    showCollisions: false,
  };
  const action = actions.editSettings({ showCollisions: true });
  const newState = reducer(state, action);
  expect(state.showCollisions).toBe(false);
  expect(newState.showCollisions).toBe(true);
});

test("Should be able to set player starting position", () => {
  const state: SettingsState = {
    ...initialState,
    startSceneId: "",
    startX: 0,
    startY: 0,
  };
  const action = actions.editPlayerStartAt({ sceneId: "scene1", x: 5, y: 6 });
  const newState = reducer(state, action);
  expect(newState.startSceneId).toBe("scene1");
  expect(newState.startX).toBe(5);
  expect(newState.startY).toBe(6);
});

test("Should fetch settings from loaded project", () => {
  const state: SettingsState = {
    ...initialState,
    worldScrollX: 0,
    worldScrollY: 0,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    settings: {
      ...dummyCompressedProjectResources.settings,
      worldScrollX: 50,
      worldScrollY: 60,
    },
  };

  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
      path: "project.gbsproj",
      scriptEventDefs: {},
      engineSchema: {
        fields: [],
        sceneTypes: [],
        consts: {},
      },
      modifiedSpriteIds: [],
      isMigrated: false,
    },
    "randomid",
    "project.gbsproj",
  );
  const newState = reducer(state, action);

  expect(newState.worldScrollX).toBe(50);
  expect(newState.worldScrollY).toBe(60);
});

test("Should be able to select settings from root state", () => {
  const state: RootState = {
    ...dummyRootState,
    project: {
      ...dummyRootState.project,
      present: {
        ...dummyRootState.project.present,
        settings: {
          ...initialState,
          zoom: 50,
        },
      },
    },
  };
  expect(getSettings(state).zoom).toBe(50);
});

describe("addScriptEventPreset", () => {
  test("Should be able to add a new script event preset", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {},
    };
    const action = actions.addScriptEventPreset({
      id: "EVENT_TEXT",
      name: "My First Text Preset",
      groups: ["text"],
      args: { text: "Hello World" },
    });
    const newState = reducer(state, action);
    expect(action.payload.presetId).toBeTruthy();
    expect(typeof action.payload.presetId).toBe("string");
    expect(newState.scriptEventPresets["EVENT_TEXT"]).toBeTruthy();

    const newPreset =
      newState.scriptEventPresets["EVENT_TEXT"][action.payload.presetId];
    expect(newPreset).toBeTruthy();
    expect(newPreset.groups).toEqual(["text"]);
    expect(newPreset.args).toEqual({ text: "Hello World" });
  });

  test("Should be able to add a new script event preset when preset already defined for event type", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "EVENT_TEXT",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
      },
    };
    const action = actions.addScriptEventPreset({
      id: "EVENT_TEXT",
      name: "My Second Text Preset",
      groups: ["layout", "behavior"],
      args: { position: "top", minHeight: 6, maxHeight: 6, speedIn: 2 },
    });
    const newState = reducer(state, action);
    expect(action.payload.presetId).toBeTruthy();
    expect(typeof action.payload.presetId).toBe("string");
    expect(newState.scriptEventPresets["EVENT_TEXT"]).toBeTruthy();

    const newPreset =
      newState.scriptEventPresets["EVENT_TEXT"][action.payload.presetId];
    expect(newPreset).toBeTruthy();
    expect(newPreset.groups).toEqual(["layout", "behavior"]);
    expect(newPreset.args).toEqual({
      position: "top",
      minHeight: 6,
      maxHeight: 6,
      speedIn: 2,
    });

    const oldPreset = newState.scriptEventPresets["EVENT_TEXT"]["preset1"];
    expect(oldPreset).toBeTruthy();
    expect(oldPreset.groups).toEqual(["text"]);
    expect(oldPreset.args).toEqual({ text: "Hello World" });
  });

  test("Should not modify other event types when adding a new preset", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "EVENT_TEXT",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
        EVENT_AUDIO: {
          preset2: {
            id: "EVENT_LAUNCH_PROJECTILE",
            name: "My First Projectile Preset",
            groups: ["source"],
            args: { actorId: "player" },
          },
        },
      },
    };
    const action = actions.addScriptEventPreset({
      id: "EVENT_TEXT",
      name: "My Second Text Preset",
      groups: ["text"],
      args: { text: "New Text" },
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventPresets["EVENT_LAUNCH_PROJECTILE"]).toBe(
      state.scriptEventPresets["EVENT_LAUNCH_PROJECTILE"],
    );
  });

  test("Should generate unique presetId for each new preset", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {},
    };
    const action1 = actions.addScriptEventPreset({
      id: "EVENT_TEXT",
      name: "Preset 1",
      groups: ["text"],
      args: { text: "First" },
    });
    const action2 = actions.addScriptEventPreset({
      id: "EVENT_TEXT",
      name: "Preset 2",
      groups: ["text"],
      args: { text: "Second" },
    });
    const newState = reducer(state, action1);
    const finalState = reducer(newState, action2);
    expect(action1.payload.presetId).not.toEqual(action2.payload.presetId);
    expect(
      finalState.scriptEventPresets["EVENT_TEXT"][action1.payload.presetId]
        .args,
    ).toEqual({ text: "First" });
    expect(
      finalState.scriptEventPresets["EVENT_TEXT"][action2.payload.presetId]
        .args,
    ).toEqual({ text: "Second" });
  });
});

describe("editScriptEventPreset", () => {
  test("Should edit an existing script event preset", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
      },
    };
    const action = actions.editScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
      name: "Updated Text Preset",
      groups: ["layout"],
      args: { text: "Hello Universe" },
    });
    const newState = reducer(state, action);
    const editedPreset = newState.scriptEventPresets["EVENT_TEXT"]["preset1"];
    expect(editedPreset).toBeTruthy();
    expect(editedPreset.name).toBe("Updated Text Preset");
    expect(editedPreset.groups).toEqual(["layout"]);
    expect(editedPreset.args).toEqual({ text: "Hello Universe" });
  });

  test("Should not edit a non-existent script event preset", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {},
      },
    };
    const action = actions.editScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "nonExistentPreset",
      name: "Non Existent Preset",
      groups: ["text"],
      args: { text: "This should not be added" },
    });
    const newState = reducer(state, action);
    expect(
      newState.scriptEventPresets["EVENT_TEXT"]["nonExistentPreset"],
    ).toBeUndefined();
  });

  test("Should not edit a preset if event type does not exist", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {},
    };
    const action = actions.editScriptEventPreset({
      id: "NON_EXISTENT_EVENT",
      presetId: "preset1",
      name: "Non Existent Event Preset",
      groups: ["text"],
      args: { text: "This should not be added" },
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventPresets["NON_EXISTENT_EVENT"]).toBeUndefined();
  });

  test("Should preserve other presets when editing a specific one", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
          preset2: {
            id: "preset2",
            name: "My Second Text Preset",
            groups: ["text"],
            args: { text: "Hello Mars" },
          },
        },
      },
    };
    const action = actions.editScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
      name: "Updated Text Preset",
      groups: ["layout"],
      args: { text: "Hello Universe" },
    });
    const newState = reducer(state, action);
    const editedPreset = newState.scriptEventPresets["EVENT_TEXT"]["preset1"];
    expect(editedPreset.name).toBe("Updated Text Preset");
    expect(newState.scriptEventPresets["EVENT_TEXT"]["preset2"].args).toEqual({
      text: "Hello Mars",
    });
  });
});

describe("removeScriptEventPreset", () => {
  test("Should remove an existing script event preset", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
          preset2: {
            id: "preset2",
            name: "My Second Text Preset",
            groups: ["text"],
            args: { text: "Hello Mars" },
          },
        },
      },
    };
    const action = actions.removeScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });
    const newState = reducer(state, action);
    expect(
      newState.scriptEventPresets["EVENT_TEXT"]["preset1"],
    ).toBeUndefined();
    expect(newState.scriptEventPresets["EVENT_TEXT"]["preset2"]).toBeTruthy();
  });

  test("Should do nothing if the preset does not exist", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
      },
    };
    const action = actions.removeScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "nonExistentPreset",
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventPresets["EVENT_TEXT"]["preset1"]).toBeTruthy();
  });

  test("Should do nothing if the event type does not exist", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
      },
    };
    const action = actions.removeScriptEventPreset({
      id: "NON_EXISTENT_EVENT",
      presetId: "preset1",
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventPresets["EVENT_TEXT"]["preset1"]).toBeTruthy();
  });

  test("Should remove the event type entry if all presets are removed", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
      },
    };
    const action = actions.removeScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventPresets).toEqual({});
  });

  test("Should not remove the event type entry if other presets exist", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
          preset2: {
            id: "preset2",
            name: "My Second Text Preset",
            groups: ["text"],
            args: { text: "Hello Mars" },
          },
        },
      },
    };
    const action = actions.removeScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventPresets["EVENT_TEXT"]).toBeTruthy();
    expect(Object.keys(newState.scriptEventPresets["EVENT_TEXT"]).length).toBe(
      1,
    );
  });

  test("Should delete the default preset entry if the default preset is removed", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
      },
      scriptEventDefaultPresets: {
        EVENT_TEXT: "preset1",
      },
    };

    const action = actions.removeScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });

    const newState = reducer(state, action);
    expect(
      newState.scriptEventPresets["EVENT_TEXT"]?.["preset1"],
    ).toBeUndefined();
    expect(newState.scriptEventDefaultPresets["EVENT_TEXT"]).toBeUndefined();
  });

  test("Should remove the event type if the last preset is deleted", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
      },
      scriptEventDefaultPresets: {
        EVENT_TEXT: "preset1",
      },
    };

    const action = actions.removeScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });

    const newState = reducer(state, action);

    expect(newState.scriptEventPresets["EVENT_TEXT"]).toBeUndefined();
    expect(newState.scriptEventDefaultPresets["EVENT_TEXT"]).toBeUndefined();
  });

  test("Should not remove the event type if other presets exist", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
          preset2: {
            id: "preset2",
            name: "My Second Text Preset",
            groups: ["text"],
            args: { text: "Hello Mars" },
          },
        },
      },
      scriptEventDefaultPresets: {
        EVENT_TEXT: "preset1",
      },
    };

    const action = actions.removeScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });

    const newState = reducer(state, action);

    expect(newState.scriptEventPresets["EVENT_TEXT"]).toBeDefined();
    expect(newState.scriptEventPresets["EVENT_TEXT"]["preset2"]).toBeDefined();
    expect(newState.scriptEventDefaultPresets["EVENT_TEXT"]).toBeUndefined();
  });

  test("Should keep other events when removing last event type", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventPresets: {
        EVENT_TEXT: {
          preset1: {
            id: "preset1",
            name: "My First Text Preset",
            groups: ["text"],
            args: { text: "Hello World" },
          },
        },
        EVENT_ANOTHER: {
          preset2: {
            id: "preset2",
            name: "My Second Text Preset",
            groups: ["text"],
            args: { text: "Hello Mars" },
          },
        },
      },
      scriptEventDefaultPresets: {},
    };

    const action = actions.removeScriptEventPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });

    const newState = reducer(state, action);

    expect(newState.scriptEventPresets["EVENT_TEXT"]).toBeUndefined();
    expect(newState.scriptEventPresets["EVENT_ANOTHER"]["preset2"].id).toBe(
      "preset2",
    );
  });
});

describe("setScriptEventDefaultPreset", () => {
  test("Should set the default preset for a specific event type", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventDefaultPresets: {},
    };
    const action = actions.setScriptEventDefaultPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventDefaultPresets["EVENT_TEXT"]).toBe("preset1");
  });

  test("Should overwrite the existing default preset for a specific event type", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventDefaultPresets: {
        EVENT_TEXT: "preset1",
      },
    };
    const action = actions.setScriptEventDefaultPreset({
      id: "EVENT_TEXT",
      presetId: "preset2",
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventDefaultPresets["EVENT_TEXT"]).toBe("preset2");
  });

  test("Should set the default preset for a new event type", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventDefaultPresets: {
        EVENT_LAUNCH_PROJECTILE: "presetA",
      },
    };
    const action = actions.setScriptEventDefaultPreset({
      id: "EVENT_TEXT",
      presetId: "preset1",
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventDefaultPresets["EVENT_TEXT"]).toBe("preset1");
    expect(newState.scriptEventDefaultPresets["EVENT_LAUNCH_PROJECTILE"]).toBe(
      "presetA",
    );
  });

  test("Should remove default preset if presetId is an empty string", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventDefaultPresets: {
        EVENT_TEXT: "preset1",
      },
    };
    const action = actions.setScriptEventDefaultPreset({
      id: "EVENT_TEXT",
      presetId: "",
    });
    const newState = reducer(state, action);
    expect(newState.scriptEventDefaultPresets["EVENT_TEXT"]).toBeUndefined();
  });

  test("Should handle setting the default preset for multiple event types", () => {
    const state: SettingsState = {
      ...initialState,
      scriptEventDefaultPresets: {
        EVENT_TEXT: "preset1",
      },
    };
    const action1 = actions.setScriptEventDefaultPreset({
      id: "EVENT_LAUNCH_PROJECTILE",
      presetId: "presetA",
    });
    const action2 = actions.setScriptEventDefaultPreset({
      id: "EVENT_ANOTHER_TYPE",
      presetId: "presetB",
    });
    let newState = reducer(state, action1);
    newState = reducer(newState, action2);
    expect(newState.scriptEventDefaultPresets["EVENT_LAUNCH_PROJECTILE"]).toBe(
      "presetA",
    );
    expect(newState.scriptEventDefaultPresets["EVENT_ANOTHER_TYPE"]).toBe(
      "presetB",
    );
    expect(newState.scriptEventDefaultPresets["EVENT_TEXT"]).toBe("preset1");
  });
});
