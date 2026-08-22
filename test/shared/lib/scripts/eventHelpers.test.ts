import {
  remapActorReferencesInEventArgs,
  remapActorReferencesInEventOverrides,
} from "shared/lib/scripts/eventHelpers";
import { loadScriptEventHandlerFromTrustedString } from "lib/scriptEventsHandlers/trustedHandler";

const noOpFileReader = () => "";

describe("remapActorReferencesInEventArgs", () => {
  test("should replace actor ids referenced in event", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
    key: "actorId",
    type: "actor",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );
    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      { actorId: "actor1" },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );
    expect(args).toEqual({
      actorId: "actor2",
    });
  });

  test("should replace nested actor ids referenced in event", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "actorId",
        type: "actor",
      },
    ],
  }
];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );
    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      { actorId: "actor1" },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );
    expect(args).toEqual({
      actorId: "actor2",
    });
  });

  test("should replace actor ids referenced by property arguments", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "property",
  type: "value",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      {
        property: {
          type: "property",
          target: "actor1",
          property: "xpos",
        },
      },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      property: {
        type: "property",
        target: "actor2",
        property: "xpos",
      },
    });
  });

  test("should replace actor ids in nested property script value arguments", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "value",
  type: "value",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      {
        value: {
          type: "add",
          valueA: {
            type: "property",
            target: "actor1",
            property: "direction",
          },
          valueB: {
            type: "property",
            target: "actor2",
            property: "direction",
          },
        },
      },
      { actor1: "actor3", actor2: "actor4" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      value: {
        type: "add",
        valueA: {
          type: "property",
          target: "actor3",
          property: "direction",
        },
        valueB: {
          type: "property",
          target: "actor4",
          property: "direction",
        },
      },
    });
  });

  test("should replace actor ids used inside array indices", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "variable",
  type: "variable",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      {
        variable: {
          type: "variable",
          value: "array1",
          index: {
            type: "property",
            target: "actor1",
            property: "xpos",
          },
        },
      },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      variable: {
        type: "variable",
        value: "array1",
        index: {
          type: "property",
          target: "actor2",
          property: "xpos",
        },
      },
    });
  });

  test("should not modify property references without an actor mapping", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "property",
  type: "value",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      {
        property: {
          type: "property",
          target: "actor1",
          property: "xpos",
        },
      },
      {},
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      property: {
        type: "property",
        target: "actor1",
        property: "xpos",
      },
    });
  });

  test("should not replace matching ids in non-actor fields", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "text",
  type: "text",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      { text: "actor1" },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      text: "actor1",
    });
  });

  test("should preserve unrelated arguments", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [
  {
    key: "actorId",
    type: "actor",
  },
  {
    key: "direction",
    type: "direction",
  },
];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      {
        actorId: "actor1",
        direction: "left",
        __comment: "Keep me",
      },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      actorId: "actor2",
      direction: "left",
      __comment: "Keep me",
    });
  });

  test("should return arguments unchanged for unknown commands", () => {
    const input = {
      actorId: "actor1",
    };

    const args = remapActorReferencesInEventArgs(
      "EVENT_UNKNOWN",
      input,
      { actor1: "actor2" },
      {},
    );

    expect(args).toEqual(input);
  });

  test("should preserve property arguments without a value", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "property",
  type: "value",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const property = {
      type: "property" as const,
    };

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      { property },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({ property });
  });

  test("should replace actor ids referenced in array set values", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "values",
  type: "arraySet",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      {
        values: [
          {
            type: "property",
            target: "actor1",
            property: "xpos",
          },
          {
            type: "number",
            value: 10,
          },
          {
            type: "add",
            valueA: {
              type: "property",
              target: "actor2",
              property: "ypos",
            },
            valueB: {
              type: "property",
              target: "actor3",
              property: "direction",
            },
          },
        ],
      },
      {
        actor1: "actor4",
        actor2: "actor5",
        actor3: "actor6",
      },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      values: [
        {
          type: "property",
          target: "actor4",
          property: "xpos",
        },
        {
          type: "number",
          value: 10,
        },
        {
          type: "add",
          valueA: {
            type: "property",
            target: "actor5",
            property: "ypos",
          },
          valueB: {
            type: "property",
            target: "actor6",
            property: "direction",
          },
        },
      ],
    });
  });

  test("should preserve unmapped actor ids in array set values", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "values",
  type: "arraySet",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const args = remapActorReferencesInEventArgs(
      "EVENT_TEST",
      {
        values: [
          {
            type: "property",
            target: "actor1",
            property: "xpos",
          },
          {
            type: "property",
            target: "actor2",
            property: "ypos",
          },
        ],
      },
      {
        actor1: "actor3",
      },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      values: [
        {
          type: "property",
          target: "actor3",
          property: "xpos",
        },
        {
          type: "property",
          target: "actor2",
          property: "ypos",
        },
      ],
    });
  });
});

describe("remapActorReferencesInEventOverrides", () => {
  test("should replace actor ids referenced in event overrides", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
    key: "actorId",
    type: "actor",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const overrides = remapActorReferencesInEventOverrides(
      {
        event1: {
          id: "event1",
          args: {
            actorId: "actor1",
          },
        },
      },
      {
        event1: {
          id: "event1",
          command: "EVENT_TEST",
          args: {},
        },
      },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(overrides).toEqual({
      event1: {
        id: "event1",
        args: {
          actorId: "actor2",
        },
      },
    });
  });

  test("should replace nested actor ids referenced in event overrides", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "actorId",
        type: "actor",
      },
    ],
  }
];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const overrides = remapActorReferencesInEventOverrides(
      {
        event1: {
          id: "event1",
          args: {
            actorId: "actor1",
          },
        },
      },
      {
        event1: {
          id: "event1",
          command: "EVENT_TEST",
          args: {},
        },
      },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(overrides).toEqual({
      event1: {
        id: "event1",
        args: {
          actorId: "actor2",
        },
      },
    });
  });

  test("should replace actor ids referenced by property arguments in event overrides", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
  key: "property",
  type: "value",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const overrides = remapActorReferencesInEventOverrides(
      {
        event1: {
          id: "event1",
          args: {
            property: {
              type: "property",
              target: "actor1",
              property: "xpos",
            },
          },
        },
      },
      {
        event1: {
          id: "event1",
          command: "EVENT_TEST",
          args: {},
        },
      },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(overrides).toEqual({
      event1: {
        id: "event1",
        args: {
          property: {
            type: "property",
            target: "actor2",
            property: "xpos",
          },
        },
      },
    });
  });

  test("should preserve unrelated override arguments", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [
  {
    key: "actorId",
    type: "actor",
  },
  {
    key: "direction",
    type: "direction",
  },
];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const overrides = remapActorReferencesInEventOverrides(
      {
        event1: {
          id: "event1",
          args: {
            actorId: "actor1",
            direction: "left",
            __comment: "Keep me",
          },
        },
      },
      {
        event1: {
          id: "event1",
          command: "EVENT_TEST",
          args: {},
        },
      },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(overrides).toEqual({
      event1: {
        id: "event1",
        args: {
          actorId: "actor2",
          direction: "left",
          __comment: "Keep me",
        },
      },
    });
  });

  test("should remap multiple event overrides", async () => {
    const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
      `
const id = "EVENT_TEST";

const fields = [{
    key: "actorId",
    type: "actor",
}];

module.exports = {
  id,
  fields,
};
`,
      "",
      noOpFileReader,
    );

    const overrides = remapActorReferencesInEventOverrides(
      {
        event1: {
          id: "event1",
          args: {
            actorId: "actor1",
          },
        },
        event2: {
          id: "event2",
          args: {
            actorId: "actor3",
          },
        },
      },
      {
        event1: {
          id: "event1",
          command: "EVENT_TEST",
          args: {},
        },
        event2: {
          id: "event2",
          command: "EVENT_TEST",
          args: {},
        },
      },
      {
        actor1: "actor2",
        actor3: "actor4",
      },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(overrides).toEqual({
      event1: {
        id: "event1",
        args: {
          actorId: "actor2",
        },
      },
      event2: {
        id: "event2",
        args: {
          actorId: "actor4",
        },
      },
    });
  });

  test("should preserve overrides without matching script events", () => {
    const input = {
      event1: {
        id: "event1",
        args: {
          actorId: "actor1",
        },
      },
    };

    const overrides = remapActorReferencesInEventOverrides(
      input,
      {},
      { actor1: "actor2" },
      {},
    );

    expect(overrides).toEqual(input);
  });

  test("should preserve overrides when command has no script event definition", () => {
    const input = {
      event1: {
        id: "event1",
        args: {
          actorId: "actor1",
        },
      },
    };

    const overrides = remapActorReferencesInEventOverrides(
      input,
      {
        event1: {
          id: "event1",
          command: "EVENT_UNKNOWN",
          args: {},
        },
      },
      { actor1: "actor2" },
      {},
    );

    expect(overrides).toEqual(input);
  });

  test("should return null and undefined overrides unchanged", () => {
    expect(
      remapActorReferencesInEventOverrides(null, {}, { actor1: "actor2" }, {}),
    ).toBeNull();
    expect(
      remapActorReferencesInEventOverrides(
        undefined,
        {},
        { actor1: "actor2" },
        {},
      ),
    ).toBeUndefined();
  });
});

describe("remapActorReferencesInEventArgs for custom event calls", () => {
  test("should replace actor ids referenced by custom event actor arguments", () => {
    const args = remapActorReferencesInEventArgs(
      "EVENT_CALL_CUSTOM_EVENT",
      {
        customEventId: "customEvent1",
        "$actor[0]$": "actor1",
      },
      { actor1: "actor2" },
      {},
    );

    expect(args).toEqual({
      customEventId: "customEvent1",
      "$actor[0]$": "actor2",
    });
  });

  test("should replace actor ids referenced by custom event property arguments", () => {
    const args = remapActorReferencesInEventArgs(
      "EVENT_CALL_CUSTOM_EVENT",
      {
        customEventId: "customEvent1",
        "$variable[V0]$": {
          type: "property",
          target: "actor1",
          property: "xpos",
        },
      },
      { actor1: "actor2" },
      {},
    );

    expect(args).toEqual({
      customEventId: "customEvent1",
      "$variable[V0]$": {
        type: "property",
        target: "actor2",
        property: "xpos",
      },
    });
  });

  test("should replace actor ids in nested custom event property arguments", () => {
    const args = remapActorReferencesInEventArgs(
      "EVENT_CALL_CUSTOM_EVENT",
      {
        customEventId: "customEvent1",
        "$variable[V0]$": {
          type: "add",
          valueA: {
            type: "property",
            target: "actor1",
            property: "direction",
          },
          valueB: {
            type: "property",
            target: "actor2",
            property: "direction",
          },
        },
      },
      { actor1: "actor3", actor2: "actor4" },
      {},
    );

    expect(args).toEqual({
      customEventId: "customEvent1",
      "$variable[V0]$": {
        type: "add",
        valueA: {
          type: "property",
          target: "actor3",
          property: "direction",
        },
        valueB: {
          type: "property",
          target: "actor4",
          property: "direction",
        },
      },
    });
  });

  test("should preserve custom event property arguments without an actor mapping", () => {
    const args = remapActorReferencesInEventArgs(
      "EVENT_CALL_CUSTOM_EVENT",
      {
        customEventId: "customEvent1",
        "$variable[V0]$": {
          type: "property",
          target: "actor1",
          property: "xpos",
        },
      },
      {},
      {},
    );

    expect(args).toEqual({
      customEventId: "customEvent1",
      "$variable[V0]$": {
        type: "property",
        target: "actor1",
        property: "xpos",
      },
    });
  });
});
