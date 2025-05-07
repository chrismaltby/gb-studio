import { ScriptEventNormalized } from "shared/lib/entities/entitiesTypes";
import { isNormalizedScriptEqual } from "shared/lib/scripts/scriptHelpers";

describe("isNormalizedScriptEqual", () => {
  test("should consider empty scripts equal", () => {
    const scriptA: string[] = [];
    const lookupA: Record<string, ScriptEventNormalized> = {};
    const scriptB: string[] = [];
    const lookupB: Record<string, ScriptEventNormalized> = {};
    expect(isNormalizedScriptEqual(scriptA, lookupA, scriptB, lookupB)).toEqual(
      true
    );
  });

  test("should consider identical scripts equal", () => {
    const scriptA: string[] = ["event1"];
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          hello: "WORLD",
        },
      },
    };
    const scriptB: string[] = ["event1"];
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          hello: "WORLD",
        },
      },
    };
    expect(isNormalizedScriptEqual(scriptA, lookupA, scriptB, lookupB)).toEqual(
      true
    );
  });

  test("should consider functionally identical scripts equal even if ids dont match", () => {
    const scriptA: string[] = ["event1"];
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          hello: "WORLD",
        },
      },
    };
    const scriptB: string[] = ["event2"];
    const lookupB: Record<string, ScriptEventNormalized> = {
      event2: {
        id: "event2",
        command: "EVENT_TEST",
        args: {
          hello: "WORLD",
        },
      },
    };
    expect(isNormalizedScriptEqual(scriptA, lookupA, scriptB, lookupB)).toEqual(
      true
    );
  });

  test("should consider functionally different scripts to not be equal", () => {
    const scriptA: string[] = ["event1"];
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          hello: "WORLD",
        },
      },
    };
    const scriptB: string[] = ["event1"];
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          hello: "THERE",
        },
      },
    };
    expect(isNormalizedScriptEqual(scriptA, lookupA, scriptB, lookupB)).toEqual(
      false
    );
  });

  test("should consider missing args to be identical to undefined args", () => {
    const scriptA: string[] = ["event1"];
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          hello: "WORLD",
          goodbye: undefined,
        },
      },
    };
    const scriptB: string[] = ["event1"];
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          hello: "WORLD",
          foo: undefined,
        },
      },
    };
    expect(isNormalizedScriptEqual(scriptA, lookupA, scriptB, lookupB)).toEqual(
      true
    );
  });
});
