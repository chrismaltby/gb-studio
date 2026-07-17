import { remapActorReferencesInEventArgs } from "shared/lib/scripts/eventHelpers";
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
