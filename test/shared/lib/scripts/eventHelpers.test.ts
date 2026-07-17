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
          value: "actor1:xpos",
        },
      },
      { actor1: "actor2" },
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      property: {
        type: "property",
        value: "actor2:xpos",
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
          value: "actor1:xpos",
        },
      },
      {},
      { EVENT_TEST: scriptEventHandler },
    );

    expect(args).toEqual({
      property: {
        type: "property",
        value: "actor1:xpos",
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
        } as any,
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
        } as any,
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
              value: "actor1:xpos",
            },
          },
        },
      },
      {
        event1: {
          id: "event1",
          command: "EVENT_TEST",
          args: {},
        } as any,
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
            value: "actor2:xpos",
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
        } as any,
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
        } as any,
        event2: {
          id: "event2",
          command: "EVENT_TEST",
          args: {},
        } as any,
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
        } as any,
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
