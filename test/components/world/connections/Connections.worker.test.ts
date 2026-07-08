/** @jest-environment jsdom */

import type { ConnectionsWorkerRequest } from "components/world/connections/Connections.worker";

let calculateConnections: typeof import("components/world/connections/Connections.worker").calculateConnections;

beforeAll(async () => {
  Object.defineProperty(global, "Worker", {
    configurable: true,
    value: class {},
  });
  ({ calculateConnections } = await import(
    "components/world/connections/Connections.worker"
  ));
});

const request = (): ConnectionsWorkerRequest => ({
  showConnections: "all",
  selectedSceneId: "",
  sceneIds: ["scene1", "scene2"],
  scenes: [
    {
      id: "scene1",
      scripts: [["call", "call"]],
      actors: [
        {
          id: "actor1",
          scripts: [["switch"]],
          overrides: {
            switch: {
              sceneId: "scene1",
              x: { type: "number", value: 7 },
              y: { type: "number", value: 8 },
              direction: "left",
            },
          },
        },
      ],
      triggers: [],
    },
    {
      id: "scene2",
      scripts: [],
      actors: [],
      triggers: [],
    },
  ],
  events: {
    call: {
      id: "call",
      command: "EVENT_CALL_CUSTOM_EVENT",
      customEventId: "custom1",
    },
    branch: {
      id: "branch",
      command: "EVENT_IF_TRUE",
      children: [["switch"]],
    },
    switch: {
      id: "switch",
      command: "EVENT_SWITCH_SCENE",
      sceneId: "scene2",
      x: { type: "number", value: 1 },
      y: { type: "number", value: 2 },
      direction: "right",
    },
  },
  customEvents: { custom1: ["branch"] },
});

test("finds nested custom-event transitions and applies prefab overrides", () => {
  expect(calculateConnections(request())).toEqual([
    {
      type: "scene",
      eventId: "switch",
      fromSceneId: "scene1",
      toSceneId: "scene2",
      entityId: "",
      toX: 1,
      toY: 2,
      direction: "right",
    },
    {
      type: "actor",
      eventId: "switch",
      fromSceneId: "scene1",
      toSceneId: "scene1",
      entityId: "actor1",
      toX: 7,
      toY: 8,
      direction: "left",
    },
  ]);
});

test("filters connections without scanning scene presentation data", () => {
  const data = request();
  data.showConnections = "selected";
  data.selectedSceneId = "scene2";

  expect(calculateConnections(data)).toHaveLength(1);
});
