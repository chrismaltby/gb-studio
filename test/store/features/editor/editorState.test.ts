import reducer, {
  initialState,
  EditorState,
  getZoomForSection,
} from "../../../../src/store/features/editor/editorState";
import actions from "../../../../src/store/features/editor/editorActions";
import entitiesActions from "../../../../src/store/features/entities/entitiesActions";
import { RootState } from "../../../../src/store/configureStore";
import { create } from "../../../redux-utils";
import { BRUSH_8PX, BRUSH_SLOPE, DRAG_ACTOR } from "consts";
import { MIN_SIDEBAR_WIDTH } from "renderer/lib/window/sidebar";
import { Variable } from "shared/lib/entities/entitiesTypes";

test("Should allow setting tool", () => {
  const state: EditorState = {
    ...initialState,
    tool: "select",
  };
  const action = actions.setTool({ tool: "eraser" });
  const newState = reducer(state, action);
  expect(newState.tool).toBe("eraser");
});

test("Should switch back to select when clicking trigger", () => {
  const state: EditorState = {
    ...initialState,
    tool: "triggers",
  };
  const action = actions.selectTrigger({ triggerId: "abc", sceneId: "def" });
  const newState = reducer(state, action);
  expect(newState.tool).toBe("select");
});

test("Unknown action should return input state", () => {
  const state: EditorState = {
    ...initialState,
    tool: "scene",
  };
  const action = {
    type: "UNKNOWN_ACTION",
  };
  const newState = reducer(state, action);
  expect(newState.tool).toBe("scene");
});

test("Default state should use select tool", () => {
  const action = {
    type: "UNKNOWN_ACTION",
  };
  const newState = reducer(undefined, action);
  expect(newState.tool).toBe("select");
});

test("Should be able to set brush", () => {
  const state: EditorState = {
    ...initialState,
    selectedBrush: "8px",
  };
  const action = actions.setBrush({ brush: "fill" });
  const newState = reducer(state, action);
  expect(newState.selectedBrush).toBe("fill");
});

test("Should be able to set selected palette", () => {
  const state: EditorState = {
    ...initialState,
    selectedPalette: 0,
  };
  const action = actions.setSelectedPalette({ paletteIndex: 2 });
  const newState = reducer(state, action);
  expect(newState.selectedPalette).toBe(2);
});

test("Should be able to set selected tile type", () => {
  const state: EditorState = {
    ...initialState,
    selectedTileType: 0,
  };
  const action = actions.setSelectedTileType({ tileType: 5, tileMask: 0xff });
  const newState = reducer(state, action);
  expect(newState.selectedTileType).toBe(5);
});

test("Should be able to toggle show layers option", () => {
  const state: EditorState = {
    ...initialState,
    showLayers: false,
  };
  const action = actions.setShowLayers({ showLayers: true });
  const newState = reducer(state, action);
  expect(newState.showLayers).toBe(true);
});

test("Should be able to scroll world view", () => {
  const state: EditorState = {
    ...initialState,
    worldScrollX: 0,
    worldScrollY: 0,
  };
  const action = actions.scrollWorld({ x: 50, y: 90 });
  const newState = reducer(state, action);
  expect(newState.worldScrollX).toBe(50);
  expect(newState.worldScrollY).toBe(90);
});

test("Should be able to resize world view", () => {
  const state: EditorState = {
    ...initialState,
    worldViewWidth: 320,
    worldViewHeight: 240,
  };
  const action = actions.resizeWorldView({ width: 640, height: 480 });
  const newState = reducer(state, action);
  expect(newState.worldViewWidth).toBe(640);
  expect(newState.worldViewHeight).toBe(480);
});

test("Should be able to focus on world", () => {
  const state: EditorState = {
    ...initialState,
    type: "scene",
    scene: "scene1",
    worldFocus: false,
  };
  const action = actions.selectWorld();
  const newState = reducer(state, action);
  expect(newState.type).toBe("world");
  expect(newState.scene).toBe("");
  expect(newState.worldFocus).toBe(true);
});

test("Should be able to focus on sidebar", () => {
  const state: EditorState = {
    ...initialState,
    type: "scene",
    scene: "scene1",
    worldFocus: true,
  };
  const action = actions.selectSidebar();
  const newState = reducer(state, action);
  expect(newState.type).toBe("scene");
  expect(newState.scene).toBe("scene1");
  expect(newState.worldFocus).toBe(false);
});

test("Should be able to hover on scene", () => {
  const state: EditorState = {
    ...initialState,
    hover: {
      sceneId: "",
      x: 0,
      y: 0,
    },
  };

  const action = actions.sceneHover({
    sceneId: "scene2",
    x: 5,
    y: 7,
  });
  const newState = reducer(state, action);
  expect(newState.hover.sceneId).toBe("scene2");
  expect(newState.hover.x).toBe(5);
  expect(newState.hover.y).toBe(7);
});

test("Should be able to select script event", () => {
  const state: EditorState = {
    ...initialState,
    eventId: "",
  };
  const action = actions.selectScriptEvent({ eventId: "event1" });
  const newState = reducer(state, action);
  expect(newState.eventId).toBe("event1");
});

test("Should be able to select scene", () => {
  const state: EditorState = {
    ...initialState,
    type: "world",
    scene: "",
    worldFocus: false,
  };
  const action = actions.selectScene({ sceneId: "scene1" });
  const newState = reducer(state, action);
  expect(newState.type).toBe("scene");
  expect(newState.scene).toBe("scene1");
  expect(newState.worldFocus).toBe(true);
});

test("Should be able to select custom event", () => {
  const state: EditorState = {
    ...initialState,
    type: "world",
    scene: "",
    entityId: "",
  };
  const action = actions.selectCustomEvent({ customEventId: "customEvent1" });
  const newState = reducer(state, action);
  expect(newState.type).toBe("customEvent");
  expect(newState.scene).toBe("");
  expect(newState.entityId).toBe("customEvent1");
});

test("Should be able to select an actor", () => {
  const state: EditorState = {
    ...initialState,
    type: "world",
    scene: "",
    entityId: "",
    worldFocus: false,
  };
  const action = actions.selectActor({ actorId: "actor1", sceneId: "scene1" });
  const newState = reducer(state, action);
  expect(newState.type).toBe("actor");
  expect(newState.scene).toBe("scene1");
  expect(newState.entityId).toBe("actor1");
  expect(newState.tool).toBe("select");
  expect(newState.worldFocus).toBe(true);
});

test("Should be able to zoom in on world", () => {
  const state: EditorState = {
    ...initialState,
    zoom: 100,
  };
  const action = actions.zoomIn({ section: "world" });
  const newState = reducer(state, action);
  expect(newState.zoom).toBe(200);
});

test("Should be able to zoom in out world", () => {
  const state: EditorState = {
    ...initialState,
    zoom: 100,
  };
  const action = actions.zoomOut({ section: "world" });
  const newState = reducer(state, action);
  expect(newState.zoom).toBe(50);
});

test("Should be able to reset world zoom", () => {
  const state: EditorState = {
    ...initialState,
    zoom: 300,
  };
  const action = actions.zoomReset({ section: "world" });
  const newState = reducer(state, action);
  expect(newState.zoom).toBe(100);
});

test("Should be able to edit search term", () => {
  const state: EditorState = {
    ...initialState,
    searchTerm: "",
  };
  const action = actions.editSearchTerm("Search Term");
  const newState = reducer(state, action);
  expect(newState.searchTerm).toBe("Search Term");
});

test("Should be able to set script tab", () => {
  const state: EditorState = {
    ...initialState,
    lastScriptTab: "",
  };
  const action = actions.setScriptTab("tab1");
  const newState = reducer(state, action);
  expect(newState.lastScriptTab).toBe("tab1");
});

test("Should be able to set script tab for scene", () => {
  const state: EditorState = {
    ...initialState,
    lastScriptTabScene: "",
  };
  const action = actions.setScriptTabScene("tab1");
  const newState = reducer(state, action);
  expect(newState.lastScriptTabScene).toBe("tab1");
});

test("Should be able to set secondary script tab", () => {
  const state: EditorState = {
    ...initialState,
    lastScriptTabSecondary: "",
  };
  const action = actions.setScriptTabSecondary("tab1");
  const newState = reducer(state, action);
  expect(newState.lastScriptTabSecondary).toBe("tab1");
});

test("Should be able to resize world sidebar", () => {
  const state: EditorState = {
    ...initialState,
    worldSidebarWidth: 400,
  };
  const action = actions.resizeWorldSidebar(550);
  const newState = reducer(state, action);
  expect(newState.worldSidebarWidth).toBe(550);
});

test("Should force world sidebar to be larger than 280px", () => {
  const state: EditorState = {
    ...initialState,
    worldSidebarWidth: 400,
  };
  const action = actions.resizeWorldSidebar(200);
  const newState = reducer(state, action);
  expect(newState.worldSidebarWidth).toBe(280);
});

test("Should be able to resize files sidebar", () => {
  const state: EditorState = {
    ...initialState,
    filesSidebarWidth: 400,
  };
  const action = actions.resizeFilesSidebar(550);
  const newState = reducer(state, action);
  expect(newState.filesSidebarWidth).toBe(550);
});

test("Should force files sidebar to be larger than 280px", () => {
  const state: EditorState = {
    ...initialState,
    filesSidebarWidth: 400,
  };
  const action = actions.resizeFilesSidebar(200);
  const newState = reducer(state, action);
  expect(newState.filesSidebarWidth).toBe(280);
});

test("Should focus on newly added scene", () => {
  const state: EditorState = {
    ...initialState,
    type: "world",
    scene: "",
    worldFocus: false,
  };
  const action = entitiesActions.addScene({ x: 0, y: 0 });
  const newState = reducer(state, action);
  expect(newState.type).toBe("scene");
  expect(newState.scene).toBe(action.payload.sceneId);
  expect(newState.worldFocus).toBe(true);
});

test("Should focus on newly added actor", () => {
  const state: EditorState = {
    ...initialState,
    type: "world",
    scene: "",
    worldFocus: false,
  };
  const action = entitiesActions.addActor({ sceneId: "scene1", x: 0, y: 0 });
  const newState = reducer(state, action);
  expect(newState.type).toBe("actor");
  expect(newState.scene).toBe("scene1");
  expect(newState.entityId).toBe(action.payload.actorId);
  expect(newState.worldFocus).toBe(true);
});

test("Should focus on newly added trigger", () => {
  const state: EditorState = {
    ...initialState,
    type: "world",
    scene: "",
    worldFocus: false,
  };
  const action = entitiesActions.addTrigger({
    sceneId: "scene1",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });
  const newState = reducer(state, action);
  expect(newState.type).toBe("trigger");
  expect(newState.scene).toBe("scene1");
  expect(newState.entityId).toBe(action.payload.triggerId);
  expect(newState.worldFocus).toBe(true);
});

test("Should focus on newly added custom event", () => {
  const state: EditorState = {
    ...initialState,
    type: "world",
    scene: "",
  };
  const action = entitiesActions.addCustomEvent();
  const newState = reducer(state, action);
  expect(newState.type).toBe("customEvent");
  expect(newState.scene).toBe("");
  expect(newState.entityId).toBe(action.payload.customEventId);
});

test("Should fetch correct zoom level for sections", () => {
  const state: RootState = {
    editor: {
      zoom: 300,
      zoomSprite: 400,
      zoomImage: 500,
    },
  } as RootState;
  expect(getZoomForSection(state, "world")).toBe(300);
  expect(getZoomForSection(state, "sprites")).toBe(400);
  expect(getZoomForSection(state, "backgrounds")).toBe(500);
  expect(getZoomForSection(state, "settings")).toBe(100);
});

test("Should allow setting selected script events", () => {
  const state: EditorState = {
    ...initialState,
    scriptEventSelectionIds: [],
    scriptEventSelectionParentId: "",
  };
  const action = actions.setScriptEventSelectedIds({
    scriptEventIds: ["b", "c", "d"],
    parentId: "a",
  });
  const newState = reducer(state, action);
  expect(newState.scriptEventSelectionIds).toEqual(["b", "c", "d"]);
  expect(newState.scriptEventSelectionParentId).toBe("a");
});

test("Should clearing selected script events", () => {
  const state: EditorState = {
    ...initialState,
    scriptEventSelectionIds: ["b", "c", "d"],
    scriptEventSelectionParentId: "a",
  };
  const action = actions.clearScriptEventSelectionIds();
  const newState = reducer(state, action);
  expect(newState.scriptEventSelectionIds).toEqual([]);
  expect(newState.scriptEventSelectionParentId).toBe("");
});

test("should remove script event from selection when toggling and value already included", () => {
  const { store, invoke } = create({
    editor: {
      scriptEventSelectionIds: ["b", "c", "d"],
      scriptEventSelectionParentId: "scene_s1_script",
    },
    project: {
      present: {
        entities: {
          scenes: {
            ids: ["s1"],
            entities: {
              s1: {
                script: ["a", "b", "c", "d", "e"],
              },
            },
          },
        },
      },
    },
  } as unknown as RootState);
  invoke(
    actions.toggleScriptEventSelectedId({
      scriptEventId: "c",
      parentType: "scene",
      parentKey: "script",
      parentId: "s1",
    }),
  );
  expect(store.dispatch).toHaveBeenCalledWith({
    payload: { parentId: "scene_s1_script", scriptEventIds: ["b", "d"] },
    type: "editor/setScriptEventSelectedIds",
  });
  expect(store.getState).toHaveBeenCalled();
});

test("should add script event to selection when toggling new value, keeping sibling order", () => {
  const { store, invoke } = create({
    editor: {
      scriptEventSelectionIds: ["a", "c", "e"],
      scriptEventSelectionParentId: "scene_s1_script",
    },
    project: {
      present: {
        entities: {
          scenes: {
            ids: ["s1"],
            entities: {
              s1: {
                script: ["a", "b", "c", "d", "e"],
              },
            },
          },
        },
      },
    },
  } as unknown as RootState);
  invoke(
    actions.toggleScriptEventSelectedId({
      scriptEventId: "d",
      parentType: "scene",
      parentKey: "script",
      parentId: "s1",
    }),
  );
  expect(store.dispatch).toHaveBeenCalledWith({
    payload: {
      parentId: "scene_s1_script",
      scriptEventIds: ["a", "c", "d", "e"],
    },
    type: "editor/setScriptEventSelectedIds",
  });
  expect(store.getState).toHaveBeenCalled();
});

test("should reset selection if selecting from a new parentId", () => {
  const { store, invoke } = create({
    editor: {
      scriptEventSelectionIds: ["a", "c", "e"],
      scriptEventSelectionParentId: "scene_s1_script",
    },
    project: {
      present: {
        entities: {
          scenes: {
            ids: ["s1", "s2"],
            entities: {
              s1: {
                script: ["a", "b", "c", "d", "e"],
              },
              s2: {
                script: ["A", "B", "C", "D", "E"],
              },
            },
          },
        },
      },
    },
  } as unknown as RootState);
  invoke(
    actions.toggleScriptEventSelectedId({
      scriptEventId: "D",
      parentType: "scene",
      parentKey: "script",
      parentId: "s2",
    }),
  );
  expect(store.dispatch).toHaveBeenCalledWith({
    payload: { parentId: "scene_s2_script", scriptEventIds: ["D"] },
    type: "editor/setScriptEventSelectedIds",
  });
  expect(store.getState).toHaveBeenCalled();
});

test("Should clearing selected script events when creating a script event group", () => {
  const state: EditorState = {
    ...initialState,
    scriptEventSelectionIds: ["b", "c", "d"],
    scriptEventSelectionParentId: "scriptEvent_a_true",
  };
  const action = entitiesActions.groupScriptEvents({
    scriptEventIds: ["b", "c", "d"],
    parentId: "a",
    parentType: "scriptEvent",
    parentKey: "true",
  });
  const newState = reducer(state, action);
  expect(newState.scriptEventSelectionIds).toEqual([]);
  expect(newState.scriptEventSelectionParentId).toBe("");
});

test("Should clearing selected script events when creating a script event group", () => {
  const state: EditorState = {
    ...initialState,
    scriptEventSelectionIds: ["b", "c", "d"],
    scriptEventSelectionParentId: "scriptEvent_a_true",
  };
  const action = entitiesActions.addScriptEvents({
    entityId: "a",
    type: "scriptEvent",
    key: "true",
    data: [
      {
        command: "EVENT_TEST",
        args: {},
      },
    ],
  });
  const newState = reducer(state, action);
  expect(newState.scriptEventSelectionIds).toEqual([]);
  expect(newState.scriptEventSelectionParentId).toBe("");
});

describe("editor reducer", () => {
  let state: EditorState;

  beforeEach(() => {
    state = { ...initialState };
  });

  describe("setTool", () => {
    test("should set the tool and reset pasteMode and prefabId", () => {
      state.pasteMode = true;
      state.prefabId = "prefab_1";
      const action = actions.setTool({ tool: "actors" });
      const newState = reducer(state, action);
      expect(newState.tool).toBe("actors");
      expect(newState.pasteMode).toBe(false);
      expect(newState.prefabId).toBe("");
    });

    test("should reset selectedBrush to BRUSH_8PX if current brush is BRUSH_SLOPE and tool is not collisions", () => {
      state.selectedBrush = BRUSH_SLOPE;
      const action = actions.setTool({ tool: "actors" });
      const newState = reducer(state, action);
      expect(newState.selectedBrush).toBe(BRUSH_8PX);
    });

    test("should not reset selectedBrush if tool is collisions", () => {
      state.selectedBrush = BRUSH_SLOPE;
      const action = actions.setTool({ tool: "collisions" });
      const newState = reducer(state, action);
      expect(newState.selectedBrush).toBe(BRUSH_SLOPE);
    });
  });

  describe("setPasteMode", () => {
    test("should set pasteMode", () => {
      const action = actions.setPasteMode(true);
      const newState = reducer(state, action);
      expect(newState.pasteMode).toBe(true);
    });
  });

  describe("setBrush", () => {
    test("should set selectedBrush", () => {
      const action = actions.setBrush({ brush: BRUSH_SLOPE });
      const newState = reducer(state, action);
      expect(newState.selectedBrush).toBe(BRUSH_SLOPE);
    });
  });

  describe("setSelectedPalette", () => {
    test("should set selectedPalette", () => {
      const action = actions.setSelectedPalette({ paletteIndex: 2 });
      const newState = reducer(state, action);
      expect(newState.selectedPalette).toBe(2);
    });
  });

  describe("setSelectedTileType", () => {
    test("should set selectedTileType", () => {
      const action = actions.setSelectedTileType({
        tileType: 1,
        tileMask: 0xff,
      });
      const newState = reducer(state, action);
      expect(newState.selectedTileType).toBe(1);
    });
  });

  describe("setShowLayers", () => {
    test("should set showLayers", () => {
      const action = actions.setShowLayers({ showLayers: false });
      const newState = reducer(state, action);
      expect(newState.showLayers).toBe(false);
    });
  });

  describe("scrollWorld", () => {
    test("should set worldScrollX and worldScrollY", () => {
      const action = actions.scrollWorld({ x: 100, y: 200 });
      const newState = reducer(state, action);
      expect(newState.worldScrollX).toBe(100);
      expect(newState.worldScrollY).toBe(200);
    });
  });

  describe("resizeWorldView", () => {
    test("should set worldViewWidth and worldViewHeight", () => {
      const action = actions.resizeWorldView({ width: 800, height: 600 });
      const newState = reducer(state, action);
      expect(newState.worldViewWidth).toBe(800);
      expect(newState.worldViewHeight).toBe(600);
    });
  });

  describe("selectWorld", () => {
    test("should reset scene, type, and clear sceneSelectionIds", () => {
      state.scene = "scene_1";
      state.type = "scene";
      state.sceneSelectionIds = ["scene_1"];
      const action = actions.selectWorld();
      const newState = reducer(state, action);
      expect(newState.scene).toBe("");
      expect(newState.type).toBe("world");
      expect(newState.worldFocus).toBe(true);
      expect(newState.sceneSelectionIds).toEqual([]);
    });
  });

  describe("selectSidebar", () => {
    test("should set worldFocus to false and reset tool if necessary", () => {
      state.tool = "actors";
      const action = actions.selectSidebar();
      const newState = reducer(state, action);
      expect(newState.worldFocus).toBe(false);
      expect(newState.tool).toBe("select");
    });

    test("should not reset tool if it's not actors, triggers, or scene", () => {
      state.tool = "collisions";
      const action = actions.selectSidebar();
      const newState = reducer(state, action);
      expect(newState.tool).toBe("collisions");
    });
  });

  describe("sceneHover", () => {
    test("should update hover state", () => {
      const action = actions.sceneHover({
        sceneId: "scene_1",
        x: 10,
        y: 20,
      });
      const newState = reducer(state, action);
      expect(newState.hover).toEqual({
        sceneId: "scene_1",
        x: 10,
        y: 20,
      });
    });

    test("should reset eventId if not dragging", () => {
      state.eventId = "event_1";
      state.dragging = "";
      const action = actions.sceneHover({
        sceneId: "scene_1",
        x: 10,
        y: 20,
      });
      const newState = reducer(state, action);
      expect(newState.eventId).toBe("");
    });

    test("should not reset eventId if dragging", () => {
      state.eventId = "event_1";
      state.dragging = DRAG_ACTOR;
      const action = actions.sceneHover({
        sceneId: "scene_1",
        x: 10,
        y: 20,
      });
      const newState = reducer(state, action);
      expect(newState.eventId).toBe("event_1");
    });
  });

  describe("selectScriptEvent", () => {
    test("should set eventId", () => {
      const action = actions.selectScriptEvent({ eventId: "event_1" });
      const newState = reducer(state, action);
      expect(newState.eventId).toBe("event_1");
    });
  });

  describe("selectScene", () => {
    test("should set type, scene, and update sceneSelectionIds", () => {
      const action = actions.selectScene({ sceneId: "scene_1" });
      const newState = reducer(state, action);
      expect(newState.type).toBe("scene");
      expect(newState.scene).toBe("scene_1");
      expect(newState.previewAsSceneId).toBe("scene_1");
      expect(newState.worldFocus).toBe(true);
      expect(newState.sceneSelectionIds).toEqual(["scene_1"]);
      expect(newState.scriptEventSelectionIds).toEqual([]);
    });

    test("should add sceneId to sceneSelectionIds if not already present", () => {
      state.sceneSelectionIds = ["scene_2"];
      const action = actions.selectScene({ sceneId: "scene_1" });
      const newState = reducer(state, action);
      expect(newState.sceneSelectionIds).toEqual(["scene_1"]);
    });
  });

  describe("selectActor", () => {
    test("should set type, scene, entityId, and tool", () => {
      const action = actions.selectActor({
        actorId: "actor_1",
        sceneId: "scene_1",
      });
      const newState = reducer(state, action);
      expect(newState.type).toBe("actor");
      expect(newState.scene).toBe("scene_1");
      expect(newState.entityId).toBe("actor_1");
      expect(newState.worldFocus).toBe(true);
      expect(newState.tool).toBe("select");
      expect(newState.sceneSelectionIds).toEqual(["scene_1"]);
      expect(newState.scriptEventSelectionIds).toEqual([]);
    });
  });

  describe("dragActorStart", () => {
    test("should set dragging to DRAG_ACTOR and set entityId and scene", () => {
      const action = actions.dragActorStart({
        actorId: "actor_1",
        sceneId: "scene_1",
      });
      const newState = reducer(state, action);
      expect(newState.dragging).toBe(DRAG_ACTOR);
      expect(newState.entityId).toBe("actor_1");
      expect(newState.scene).toBe("scene_1");
      expect(newState.worldFocus).toBe(true);
      expect(newState.sceneSelectionIds).toEqual(["scene_1"]);
      expect(newState.scriptEventSelectionIds).toEqual([]);
    });
  });

  describe("dragActorStop", () => {
    test("should reset dragging", () => {
      state.dragging = DRAG_ACTOR;
      const action = actions.dragActorStop();
      const newState = reducer(state, action);
      expect(newState.dragging).toBe("");
    });
  });

  describe("zoomIn", () => {
    test("should increase zoom for the specified section", () => {
      const action = actions.zoomIn({ section: "world" });
      const newState = reducer(state, action);
      expect(newState.zoom).toBeGreaterThan(state.zoom);
    });

    test("should not exceed maximum zoom", () => {
      state.zoom = 800;
      const action = actions.zoomIn({ section: "world" });
      const newState = reducer(state, action);
      expect(newState.zoom).toBe(800);
    });

    test("should increase zoom by delta if provided", () => {
      const action = actions.zoomIn({ section: "world", delta: 50 });
      const newState = reducer(state, action);
      expect(newState.zoom).toBe(state.zoom + 50);
    });
  });

  describe("zoomOut", () => {
    test("should decrease zoom for the specified section", () => {
      const action = actions.zoomOut({ section: "world" });
      const newState = reducer(state, action);
      expect(newState.zoom).toBeLessThan(state.zoom);
    });

    test("should not go below minimum zoom", () => {
      state.zoom = 25;
      const action = actions.zoomOut({ section: "world" });
      const newState = reducer(state, action);
      expect(newState.zoom).toBe(25);
    });

    test("should decrease zoom by delta if provided", () => {
      const action = actions.zoomOut({ section: "world", delta: 50 });
      const newState = reducer(state, action);
      expect(newState.zoom).toBe(state.zoom - 50);
    });
  });

  describe("zoomReset", () => {
    test("should reset zoom to default value for the section", () => {
      state.zoom = 150;
      const action = actions.zoomReset({ section: "world" });
      const newState = reducer(state, action);
      expect(newState.zoom).toBe(100);
    });

    test("should reset zoomSpriteTiles to 400 for spriteTiles section", () => {
      state.zoomSpriteTiles = 200;
      const action = actions.zoomReset({ section: "spriteTiles" });
      const newState = reducer(state, action);
      expect(newState.zoomSpriteTiles).toBe(400);
    });
  });

  describe("resizeWorldSidebar", () => {
    test("should set worldSidebarWidth not less than MIN_SIDEBAR_WIDTH", () => {
      const action = actions.resizeWorldSidebar(100);
      const newState = reducer(state, action);
      expect(newState.worldSidebarWidth).toBeGreaterThanOrEqual(
        MIN_SIDEBAR_WIDTH,
      );
    });
  });

  describe("editSearchTerm", () => {
    test("should set searchTerm and reset focusSceneId and sceneSelectionIds", () => {
      state.focusSceneId = "scene_1";
      state.sceneSelectionIds = ["scene_1"];
      const action = actions.editSearchTerm("test");
      const newState = reducer(state, action);
      expect(newState.searchTerm).toBe("test");
      expect(newState.focusSceneId).toBe("");
      expect(newState.sceneSelectionIds).toEqual([]);
    });
  });

  describe("setScriptTab", () => {
    test("should set lastScriptTab", () => {
      const action = actions.setScriptTab("tab_1");
      const newState = reducer(state, action);
      expect(newState.lastScriptTab).toBe("tab_1");
    });
  });

  describe("setClipboardVariables", () => {
    test("should set clipboardVariables", () => {
      const variables = [{ id: "var_1" }, { id: "var_2" }] as Variable[];
      const action = actions.setClipboardVariables(variables);
      const newState = reducer(state, action);
      expect(newState.clipboardVariables).toEqual(variables);
    });
  });

  describe("setFocusSceneId", () => {
    test("should set focusSceneId", () => {
      const action = actions.setFocusSceneId("scene_1");
      const newState = reducer(state, action);
      expect(newState.focusSceneId).toBe("scene_1");
    });
  });

  describe("setSelectedSpriteSheetId", () => {
    test("should reset sprite-related selections", () => {
      state.selectedSpriteStateId = "state_1";
      state.selectedAnimationId = "anim_1";
      state.selectedMetaspriteId = "meta_1";
      state.selectedAdditionalMetaspriteIds = ["meta_1", "meta_2"];
      state.selectedMetaspriteTileIds = ["tile_1"];
      state.playSpriteAnimation = true;
      state.replaceSpriteTileMode = true;

      const action = actions.setSelectedSpriteSheetId("sprite_1");
      const newState = reducer(state, action);
      expect(newState.selectedSpriteSheetId).toBe("sprite_1");
      expect(newState.selectedSpriteStateId).toBe("");
      expect(newState.selectedAnimationId).toBe("");
      expect(newState.selectedMetaspriteId).toBe("");
      expect(newState.selectedAdditionalMetaspriteIds).toEqual([]);
      expect(newState.selectedMetaspriteTileIds).toEqual([]);
      expect(newState.playSpriteAnimation).toBe(false);
      expect(newState.replaceSpriteTileMode).toBe(false);
      expect(newState.spriteTileSelection).toBeUndefined();
    });
  });

  describe("setSelectedAnimationId", () => {
    test("should set selectedAnimationId and selectedSpriteStateId", () => {
      const action = actions.setSelectedAnimationId({
        animationId: "anim_1",
        stateId: "state_1",
      });
      const newState = reducer(state, action);
      expect(newState.selectedAnimationId).toBe("anim_1");
      expect(newState.selectedSpriteStateId).toBe("state_1");
      expect(newState.selectedMetaspriteId).toBe("");
      expect(newState.selectedAdditionalMetaspriteIds).toEqual([]);
      expect(newState.selectedMetaspriteTileIds).toEqual([]);
      expect(newState.playSpriteAnimation).toBe(false);
      expect(newState.replaceSpriteTileMode).toBe(false);
    });
  });

  describe("setSelectedMetaspriteId", () => {
    test("should set selectedMetaspriteId and reset selectedMetaspriteTileIds", () => {
      state.selectedAdditionalMetaspriteIds = ["meta_2"];
      state.selectedMetaspriteTileIds = ["tile_1"];
      const action = actions.setSelectedMetaspriteId("meta_1");
      const newState = reducer(state, action);
      expect(newState.selectedMetaspriteId).toBe("meta_1");
      expect(newState.selectedAdditionalMetaspriteIds).toEqual(["meta_1"]);
      expect(newState.selectedMetaspriteTileIds).toEqual([]);
      expect(newState.replaceSpriteTileMode).toBe(false);
    });
  });

  describe("toggleMultiSelectedMetaspriteId", () => {
    test("should add metasprite to selection if not present", () => {
      state.selectedMetaspriteId = "meta_1";
      state.selectedAdditionalMetaspriteIds = ["meta_1"];
      const action = actions.toggleMultiSelectedMetaspriteId("meta_2");
      const newState = reducer(state, action);
      expect(newState.selectedAdditionalMetaspriteIds).toEqual([
        "meta_1",
        "meta_2",
      ]);
    });

    test("should remove metasprite from selection if present", () => {
      state.selectedMetaspriteId = "meta_1";
      state.selectedAdditionalMetaspriteIds = ["meta_1", "meta_2"];
      const action = actions.toggleMultiSelectedMetaspriteId("meta_2");
      const newState = reducer(state, action);
      expect(newState.selectedAdditionalMetaspriteIds).toEqual(["meta_1"]);
    });

    test("should not remove selectedMetaspriteId from selection", () => {
      state.selectedMetaspriteId = "meta_1";
      state.selectedAdditionalMetaspriteIds = ["meta_1", "meta_2"];
      const action = actions.toggleMultiSelectedMetaspriteId("meta_1");
      const newState = reducer(state, action);
      expect(newState.selectedAdditionalMetaspriteIds).toEqual([
        "meta_1",
        "meta_2",
      ]);
    });

    test("should set selectedMetaspriteId if no multiselection exists", () => {
      state.selectedMetaspriteId = "";
      state.selectedAdditionalMetaspriteIds = [];
      const action = actions.toggleMultiSelectedMetaspriteId("meta_1");
      const newState = reducer(state, action);
      expect(newState.selectedMetaspriteId).toBe("meta_1");
      expect(newState.selectedAdditionalMetaspriteIds).toEqual(["meta_1"]);
    });
  });

  describe("addMetaspriteIdsToMultiSelection", () => {
    test("should add metasprite ids to selection", () => {
      state.selectedMetaspriteId = "meta_1";
      state.selectedAdditionalMetaspriteIds = ["meta_1"];
      const action = actions.addMetaspriteIdsToMultiSelection([
        "meta_2",
        "meta_3",
      ]);
      const newState = reducer(state, action);
      expect(newState.selectedAdditionalMetaspriteIds).toEqual([
        "meta_1",
        "meta_2",
        "meta_3",
      ]);
    });

    test("should set selectedMetaspriteId if no multiselection exists", () => {
      state.selectedMetaspriteId = "";
      state.selectedAdditionalMetaspriteIds = [];
      const action = actions.addMetaspriteIdsToMultiSelection([
        "meta_1",
        "meta_2",
      ]);
      const newState = reducer(state, action);
      expect(newState.selectedMetaspriteId).toBe("meta_1");
      expect(newState.selectedAdditionalMetaspriteIds).toEqual([
        "meta_1",
        "meta_2",
      ]);
    });
  });

  describe("clearMultiSelectedMetaspriteId", () => {
    test("should reset selectedAdditionalMetaspriteIds", () => {
      state.selectedMetaspriteId = "meta_1";
      state.selectedAdditionalMetaspriteIds = ["meta_1", "meta_2"];
      const action = actions.clearMultiSelectedMetaspriteId();
      const newState = reducer(state, action);
      expect(newState.selectedAdditionalMetaspriteIds).toEqual(["meta_1"]);
    });
  });

  describe("setSelectedMetaspriteTileId", () => {
    test("should set selectedMetaspriteTileIds", () => {
      const action = actions.setSelectedMetaspriteTileId("tile_1");
      const newState = reducer(state, action);
      expect(newState.selectedMetaspriteTileIds).toEqual(["tile_1"]);
      expect(newState.playSpriteAnimation).toBe(false);
      expect(newState.replaceSpriteTileMode).toBe(false);
    });
  });

  describe("setShowOnionSkin", () => {
    test("should set showOnionSkin", () => {
      const action = actions.setShowOnionSkin(true);
      const newState = reducer(state, action);
      expect(newState.showOnionSkin).toBe(true);
    });
  });

  describe("setParallaxHoverLayer", () => {
    test("should set parallaxHoverLayer", () => {
      const action = actions.setParallaxHoverLayer(2);
      const newState = reducer(state, action);
      expect(newState.parallaxHoverLayer).toBe(2);
    });

    test("should reset parallaxHoverLayer when undefined", () => {
      state.parallaxHoverLayer = 2;
      const action = actions.setParallaxHoverLayer(undefined);
      const newState = reducer(state, action);
      expect(newState.parallaxHoverLayer).toBeUndefined();
    });
  });

  describe("setPrecisionTileMode", () => {
    test("should set precisionTileMode", () => {
      const action = actions.setPrecisionTileMode(true);
      const newState = reducer(state, action);
      expect(newState.precisionTileMode).toBe(true);
    });
  });

  describe("setSceneSelectionIds", () => {
    test("should set sceneSelectionIds and focus on first scene", () => {
      const action = actions.setSceneSelectionIds(["scene_1", "scene_2"]);
      const newState = reducer(state, action);
      expect(newState.sceneSelectionIds).toEqual(["scene_1", "scene_2"]);
      expect(newState.scene).toBe("scene_1");
      expect(newState.type).toBe("scene");
      expect(newState.worldFocus).toBe(true);
    });
  });

  describe("addSceneSelectionIds", () => {
    test("should add scene ids to selection without duplicates", () => {
      state.sceneSelectionIds = ["scene_1"];
      const action = actions.addSceneSelectionIds(["scene_1", "scene_2"]);
      const newState = reducer(state, action);
      expect(newState.sceneSelectionIds).toEqual(["scene_1", "scene_2"]);
    });

    test("should focus on first scene if not in scene mode", () => {
      state.type = "world";
      const action = actions.addSceneSelectionIds(["scene_1", "scene_2"]);
      const newState = reducer(state, action);
      expect(newState.scene).toBe("scene_1");
      expect(newState.type).toBe("scene");
      expect(newState.worldFocus).toBe(true);
    });
  });

  describe("removeSceneSelectionIds", () => {
    test("should remove scene ids from selection", () => {
      state.sceneSelectionIds = ["scene_1", "scene_2", "scene_3"];
      const action = actions.removeSceneSelectionIds(["scene_2"]);
      const newState = reducer(state, action);
      expect(newState.sceneSelectionIds).toEqual(["scene_1", "scene_3"]);
    });
  });

  describe("toggleSceneSelectedId", () => {
    test("should add scene to selection if not present", () => {
      state.sceneSelectionIds = ["scene_1"];
      const action = actions.toggleSceneSelectedId("scene_2");
      const newState = reducer(state, action);
      expect(newState.sceneSelectionIds).toEqual(["scene_1", "scene_2"]);
    });

    test("should remove scene from selection if present", () => {
      state.sceneSelectionIds = ["scene_1", "scene_2"];
      const action = actions.toggleSceneSelectedId("scene_2");
      const newState = reducer(state, action);
      expect(newState.sceneSelectionIds).toEqual(["scene_1"]);
    });

    test("should reset scene if toggling focused scene id", () => {
      state.scene = "scene_1";
      state.type = "scene";
      state.sceneSelectionIds = ["scene_1"];
      const action = actions.toggleSceneSelectedId("scene_1");
      const newState = reducer(state, action);
      expect(newState.scene).toBe("");
      expect(newState.type).toBe("world");
      expect(newState.worldFocus).toBe(true);
      expect(newState.sceneSelectionIds).toEqual([]);
    });
  });

  describe("clearSceneSelectionIds", () => {
    test("should clear sceneSelectionIds", () => {
      state.sceneSelectionIds = ["scene_1", "scene_2"];
      const action = actions.clearSceneSelectionIds();
      const newState = reducer(state, action);
      expect(newState.sceneSelectionIds).toEqual([]);
    });
  });
});
