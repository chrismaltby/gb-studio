import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import projectActions from "store/features/project/projectActions";
import {
  dummyCompressedSceneResource,
  dummyCompressedProjectResources,
  dummyCompressedBackgroundResource,
  dummyCompressedTilesetResource,
} from "../../../../dummydata";
import { CompressedProjectResources } from "shared/lib/resources/types";
import { compressNumberArray } from "shared/lib/resources/compression";
import { encodeSceneTileRef } from "shared/lib/tiles/sceneTilemapData";

test("Should fix scene widths if backgrounds has been removed since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "missingbg",
        width: 20,
        height: 18,
      },
    ],
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
  expect(newState.scenes.entities["scene1"]?.width).toBe(32);
  expect(newState.scenes.entities["scene1"]?.height).toBe(32);
});

test("Should fix scene widths if backgrounds have changed dimensions since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...dummyCompressedBackgroundResource,
        id: "bg1",
        width: 64,
        height: 40,
      },
    ],
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
  expect(newState.scenes.entities["scene1"]?.width).toBe(64);
  expect(newState.scenes.entities["scene1"]?.height).toBe(40);
});

test("Should keep scene widths if backgrounds have NOT changed dimensions since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...dummyCompressedBackgroundResource,
        id: "bg1",
        width: 20,
        height: 18,
      },
    ],
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
  expect(newState.scenes.entities["scene1"]?.width).toBe(20);
  expect(newState.scenes.entities["scene1"]?.height).toBe(18);
});

test("Should preserve painted scene dimensions without a background", () => {
  const state: EntitiesState = { ...initialState };
  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "",
        width: 40,
        height: 30,
        tilemap: {
          tilesets: [],
          layers: [
            {
              id: "layer",
              name: "Layer",
              visible: true,
              tiles: "",
            },
          ],
        },
      },
    ],
  };
  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
      path: "project.gbsproj",
      scriptEventDefs: {},
      engineSchema: { fields: [], sceneTypes: [], consts: {} },
      modifiedSpriteIds: [],
      isMigrated: false,
    },
    "randomid",
    "project.gbsproj",
  );
  const newState = reducer(state, action);
  expect(newState.scenes.entities.scene1?.width).toBe(40);
  expect(newState.scenes.entities.scene1?.height).toBe(30);
});

test("Should update all tilemap references for resized tilesets on load", () => {
  const state: EntitiesState = { ...initialState };
  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    tilesets: [
      {
        ...dummyCompressedTilesetResource,
        id: "tiles1",
        width: 2,
        height: 2,
        imageWidth: 24,
        imageHeight: 16,
      },
      {
        ...dummyCompressedTilesetResource,
        id: "tiles2",
        width: 2,
        height: 1,
        imageWidth: 24,
        imageHeight: 8,
      },
    ],
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        tilemap: {
          tilesets: [
            { id: "tiles1", width: 2, height: 2 },
            { id: "tiles2", width: 2, height: 1 },
          ],
          autotiles: [{ type: "2x2", startTile: encodeSceneTileRef(0, 3) }],
          layers: [
            {
              id: "layer",
              name: "Layer",
              visible: true,
              tiles: compressNumberArray([
                encodeSceneTileRef(0, 3),
                encodeSceneTileRef(4, 1),
              ]),
              autotiles: compressNumberArray([1]),
            },
          ],
        },
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
      path: "project.gbsproj",
      scriptEventDefs: {},
      engineSchema: { fields: [], sceneTypes: [], consts: {} },
      modifiedSpriteIds: [],
      isMigrated: false,
    },
    "randomid",
    "project.gbsproj",
  );
  const newState = reducer(state, action);

  expect(newState.scenes.entities.scene1?.tilemap?.tilesets).toEqual([
    { id: "tiles1", width: 3, height: 2 },
    { id: "tiles2", width: 3, height: 1 },
  ]);
  expect(newState.scenes.entities.scene1?.tilemap?.layers[0]).toMatchObject({
    tiles: [encodeSceneTileRef(0, 4), encodeSceneTileRef(6, 1)],
    autotiles: [0],
  });
  expect(newState.scenes.entities.scene1?.tilemap?.autotiles).toEqual([]);
});
