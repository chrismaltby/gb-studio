import {
  getAutoLabel,
  replaceAutoLabelLocalValues,
} from "../../src/shared/lib/scripts/autoLabel";
import type { ScriptEventHandlers } from "lib/scriptEventsHandlers/handlerTypes";

describe("autoLabel with engine constants", () => {
  const mockLookups = {
    variableNameForId: (id: unknown) => {
      const strId = String(id);
      const names: Record<string, string> = {
        "10": "PlayerHealth",
        V0: "Score",
      };
      return names[strId] || `Variable${strId}`;
    },
    constantNameForId: (id: unknown) => {
      const strId = String(id);
      const names: Record<string, string> = {
        "550e8400-e29b-41d4-a716-446655440000": "MAX_SCORE",
      };
      return names[strId] || `Constant${strId}`;
    },
    actorNameForId: () => "Actor",
    sceneNameForId: () => "Scene",
    spriteNameForId: () => "Sprite",
    emoteNameForId: () => "Emote",
    customEventNameForId: () => "CustomEvent",
  };

  test("should replace engine constants in labels", () => {
    const input = "Set health to ||constant:engine::MAX_HEALTH||";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("Set health to MAX_HEALTH");
  });

  test("should replace engine constants with underscores", () => {
    const input = "Use ||constant:engine::PLAYER_MAX_SPEED|| for speed";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("Use PLAYER_MAX_SPEED for speed");
  });

  test("should replace engine constants with dashes", () => {
    const input = "Use ||constant:engine::PLAYER-MAX-SPEED|| for speed";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("Use PLAYER-MAX-SPEED for speed");
  });

  test("should replace engine constants with numbers", () => {
    const input =
      "Level max is ||constant:engine::LEVEL_1_MAX|| or ||constant:engine::LEVEL_2_MAX||";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("Level max is LEVEL_1_MAX or LEVEL_2_MAX");
  });

  test("should replace both user and engine constants", () => {
    const input =
      "Add ||constant:550e8400-e29b-41d4-a716-446655440000|| to ||constant:engine::BONUS||";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("Add MAX_SCORE to BONUS");
  });

  test("should replace engine constants alongside variables", () => {
    const input = "Set ||variable:10|| to ||constant:engine::DEFAULT_HEALTH||";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("Set PlayerHealth to DEFAULT_HEALTH");
  });

  test("should handle multiple engine constants in one label", () => {
    const input =
      "Calculate ||constant:engine::MIN|| + ||constant:engine::MAX|| / 2";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("Calculate MIN + MAX / 2");
  });

  test("should preserve text without constants", () => {
    const input = "This is plain text";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("This is plain text");
  });

  test("should handle engine constants with special characters", () => {
    const input = "Value: ||constant:engine::CONFIG_VALUE_1||";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe("Value: CONFIG_VALUE_1");
  });

  test("should not replace malformed engine constants containing punctuation", () => {
    const input = "Use ||constant:engine::PLAYER:MAX:SPEED|| for speed";
    const result = replaceAutoLabelLocalValues(input, mockLookups);
    expect(result).toBe(input);
  });
});

describe("autoLabel with indexed variables", () => {
  const indexedMockLookups = {
    variableNameForId: (id: unknown) => {
      const names: Record<string, string> = {
        "10": "PlayerHealth",
        V0: "Score",
      };
      return names[String(id)] ?? String(id);
    },
    constantNameForId: (id: unknown) =>
      id === "33333333-3333-3333-3333-333333333333"
        ? "START_INDEX"
        : String(id),
    actorNameForId: String,
    sceneNameForId: String,
    spriteNameForId: String,
    emoteNameForId: String,
    customEventNameForId: String,
  };
  const scriptEventDefs = {
    EVENT_TEST: {
      fieldsLookup: {
        variable: {
          type: "variable",
        },
      },
      autoLabel: (fetchArg: (key: string) => string) =>
        `Increment ${fetchArg("variable")}`,
    },
  } as unknown as ScriptEventHandlers;

  test("formats static variable indices", () => {
    expect(
      getAutoLabel(
        "EVENT_TEST",
        {
          variable: {
            type: "variable",
            value: "10",
            index: { type: "number", value: 3 },
          },
        },
        scriptEventDefs,
      ),
    ).toBe("Increment ||variable:10||[3]");
  });

  test("formats variable indices", () => {
    const label = getAutoLabel(
      "EVENT_TEST",
      {
        variable: {
          type: "variable",
          value: "10",
          index: { type: "variable", value: "V0" },
        },
      },
      scriptEventDefs,
    );
    expect(replaceAutoLabelLocalValues(label, indexedMockLookups)).toBe(
      "Increment PlayerHealth[Score]",
    );
  });

  test("formats constant indices", () => {
    const label = getAutoLabel(
      "EVENT_TEST",
      {
        variable: {
          type: "variable",
          value: "10",
          index: {
            type: "constant",
            value: "33333333-3333-3333-3333-333333333333",
          },
        },
      },
      scriptEventDefs,
    );
    expect(replaceAutoLabelLocalValues(label, indexedMockLookups)).toBe(
      "Increment PlayerHealth[START_INDEX]",
    );
  });
});
