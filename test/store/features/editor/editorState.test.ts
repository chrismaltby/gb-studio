import reducer, {
  initialState,
  EditorState,
  getZoomForSection,
} from "../../../../src/store/features/editor/editorState";
import actions from "../../../../src/store/features/editor/editorActions";
import entitiesActions from "../../../../src/store/features/entities/entitiesActions";
import { RootState } from "../../../../src/store/configureStore";
import { create } from "../../../redux-utils";

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
  const action = actions.setSelectedTileType({ tileType: 5 });
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
      scriptEventSelectionParentId: "s1",
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
    })
  );
  expect(store.dispatch).toHaveBeenCalledWith({
    payload: { parentId: "s1", scriptEventIds: ["b", "d"] },
    type: "editor/setScriptEventSelectedId",
  });
  expect(store.getState).toHaveBeenCalled();
});

test("should add script event to selection when toggling new value, keeping sibling order", () => {
  const { store, invoke } = create({
    editor: {
      scriptEventSelectionIds: ["a", "c", "e"],
      scriptEventSelectionParentId: "s1",
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
    })
  );
  expect(store.dispatch).toHaveBeenCalledWith({
    payload: { parentId: "s1", scriptEventIds: ["a", "c", "d", "e"] },
    type: "editor/setScriptEventSelectedId",
  });
  expect(store.getState).toHaveBeenCalled();
});

test("should reset selection if selecting from a new parentId", () => {
  const { store, invoke } = create({
    editor: {
      scriptEventSelectionIds: ["a", "c", "e"],
      scriptEventSelectionParentId: "s1",
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
    })
  );
  expect(store.dispatch).toHaveBeenCalledWith({
    payload: { parentId: "s2", scriptEventIds: ["D"] },
    type: "editor/setScriptEventSelectedId",
  });
  expect(store.getState).toHaveBeenCalled();
});

test("Should clearing selected script events when creating a script event group", () => {
  const state: EditorState = {
    ...initialState,
    scriptEventSelectionIds: ["b", "c", "d"],
    scriptEventSelectionParentId: "a",
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
    scriptEventSelectionParentId: "a",
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
