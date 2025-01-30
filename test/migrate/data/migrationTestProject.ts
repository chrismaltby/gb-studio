import { CompressedProjectResources } from "shared/lib/resources/types";
import {
  dummyActorPrefabResource,
  dummyActorResource,
  dummyCompressedProjectResources,
  dummyCompressedSceneResource,
  dummyScriptResource,
  dummyTriggerPrefabResource,
  dummyTriggerResource,
} from "../../dummydata";

export const migrationTestProject: CompressedProjectResources = {
  ...dummyCompressedProjectResources,
  scripts: [
    {
      ...dummyScriptResource,
      script: [
        {
          id: "event1",
          command: "EVENT_SWITCH",
          args: {
            value1: 1,
            value2: 10,
            value3: 100,
          },
        },
      ],
    },
  ],
  metadata: {
    ...dummyCompressedProjectResources.metadata,
    _version: "4.1.0",
    _release: "1",
  },
};

export const migrateActorsTestProject: CompressedProjectResources = {
  ...dummyCompressedProjectResources,
  scenes: [
    {
      ...dummyCompressedSceneResource,
      actors: [
        {
          ...dummyActorResource,
          script: [
            {
              command: "EVENT_TEST",
              args: {
                value: "FIND",
              },
              id: "event1",
            },
          ],
        },
      ],
    },
  ],
};

export const migrateActorPrefabsTestProject: CompressedProjectResources = {
  ...dummyCompressedProjectResources,
  actorPrefabs: [
    {
      ...dummyActorPrefabResource,
      id: "prefab1",
      script: [
        {
          command: "EVENT_TEST",
          args: {
            value: "FIND",
          },
          id: "event1",
        },
      ],
    },
  ],
  scenes: [
    {
      ...dummyCompressedSceneResource,
      actors: [
        {
          ...dummyActorResource,
          prefabId: "prefab1",
          prefabScriptOverrides: {
            event1: {
              id: "event1",
              args: {
                value: "FIND",
              },
            },
          },
        },
      ],
    },
  ],
};

export const migrateActorPrefabsTestProject2: CompressedProjectResources = {
  ...dummyCompressedProjectResources,
  actorPrefabs: [
    {
      ...dummyActorPrefabResource,
      id: "prefab1",
      script: [
        {
          command: "EVENT_TEST",
          args: {
            value2: "FOO",
          },
          id: "event1",
        },
      ],
    },
  ],
  scenes: [
    {
      ...dummyCompressedSceneResource,
      actors: [
        {
          ...dummyActorResource,
          prefabId: "prefab1",
          prefabScriptOverrides: {
            event1: {
              id: "event1",
              args: {},
            },
            event2: {
              id: "event2",
              args: {
                value: "FIND",
              },
            },
          },
        },
      ],
    },
  ],
};

export const migrateTriggerPrefabsTestProject: CompressedProjectResources = {
  ...dummyCompressedProjectResources,
  triggerPrefabs: [
    {
      ...dummyTriggerPrefabResource,
      id: "prefab1",
      script: [
        {
          command: "EVENT_TEST",
          args: {
            value: "FIND",
          },
          id: "event1",
        },
      ],
    },
  ],
  scenes: [
    {
      ...dummyCompressedSceneResource,
      triggers: [
        {
          ...dummyTriggerResource,
          prefabId: "prefab1",
          prefabScriptOverrides: {
            event1: {
              id: "event1",
              args: {
                value: "FIND",
              },
            },
          },
        },
      ],
    },
  ],
};

export const migrateTriggerPrefabsTestProject2: CompressedProjectResources = {
  ...dummyCompressedProjectResources,
  triggerPrefabs: [
    {
      ...dummyTriggerPrefabResource,
      id: "prefab1",
      script: [
        {
          command: "EVENT_TEST",
          args: {
            value2: "FOO",
          },
          id: "event1",
        },
      ],
    },
  ],
  scenes: [
    {
      ...dummyCompressedSceneResource,
      triggers: [
        {
          ...dummyTriggerResource,
          prefabId: "prefab1",
          prefabScriptOverrides: {
            event1: {
              id: "event1",
              args: {},
            },
            event2: {
              id: "event2",
              args: {
                value: "FIND",
              },
            },
          },
        },
      ],
    },
  ],
};
