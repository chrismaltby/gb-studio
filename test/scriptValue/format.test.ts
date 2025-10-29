import { scriptValueToString } from "shared/lib/scriptValue/format";
import { ScriptValue } from "shared/lib/scriptValue/types";

describe("scriptValueToString", () => {
  const options = {
    variableNameForId: (value: string) => `var_${value}`,
    constantNameForId: (value: string) => `const_${value}`,
    actorNameForId: (value: string) => `actor_${value}`,
    propertyNameForId: (value: string) => `prop_${value}`,
    directionForValue: (value: string) => `dir_${value}`,
  };

  test("should handle number type", () => {
    const input: ScriptValue = { type: "number", value: 42 };
    const result = scriptValueToString(input, options);
    expect(result).toBe("42");
  });

  test("should handle missing script value", () => {
    const result = scriptValueToString(undefined, options);
    expect(result).toBe("0");
  });

  test("should handle variable type", () => {
    const input: ScriptValue = { type: "variable", value: "V0" };
    const result = scriptValueToString(input, options);
    expect(result).toBe("var_V0");
  });

  test("should handle direction type", () => {
    const input: ScriptValue = { type: "direction", value: "right" };
    const result = scriptValueToString(input, options);
    expect(result).toBe("dir_right");
  });

  test("should handle property type", () => {
    const input: ScriptValue = {
      type: "property",
      target: "actor1",
      property: "prop1",
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("actor_actor1.prop_prop1");
  });

  test("should handle true type", () => {
    const input: ScriptValue = { type: "true" };
    const result = scriptValueToString(input, options);
    expect(result).toBe("true");
  });

  test("should handle false type", () => {
    const input: ScriptValue = { type: "false" };
    const result = scriptValueToString(input, options);
    expect(result).toBe("false");
  });

  test("should handle add operation", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: { type: "number", value: 1 },
      valueB: { type: "number", value: 2 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(1 + 2)");
  });

  test("should handle sub operation", () => {
    const input: ScriptValue = {
      type: "sub",
      valueA: { type: "number", value: 5 },
      valueB: { type: "number", value: 3 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(5 - 3)");
  });

  test("should handle mul operation", () => {
    const input: ScriptValue = {
      type: "mul",
      valueA: { type: "number", value: 2 },
      valueB: { type: "number", value: 3 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(2 * 3)");
  });

  test("should handle div operation", () => {
    const input: ScriptValue = {
      type: "div",
      valueA: { type: "number", value: 6 },
      valueB: { type: "number", value: 2 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(6 / 2)");
  });

  test("should handle complex nested operations", () => {
    const input: ScriptValue = {
      type: "add",
      valueA: {
        type: "mul",
        valueA: { type: "number", value: 2 },
        valueB: { type: "number", value: 3 },
      },
      valueB: {
        type: "div",
        valueA: { type: "number", value: 6 },
        valueB: { type: "number", value: 2 },
      },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("((2 * 3) + (6 / 2))");
  });

  test("should handle expression with variable substitution", () => {
    const input: ScriptValue = { type: "expression", value: "$V0$ + $V1$" };
    const result = scriptValueToString(input, options);
    expect(result).toBe("var_V0 + var_V1");
  });

  test("should handle unary not operation", () => {
    const input: ScriptValue = { type: "not", value: { type: "true" } };
    const result = scriptValueToString(input, options);
    expect(result).toBe("!(true)");
  });

  test("should handle unary abs operation", () => {
    const input: ScriptValue = {
      type: "abs",
      value: { type: "number", value: -5 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("abs(-5)");
  });

  test("should handle binary and operation", () => {
    const input: ScriptValue = {
      type: "and",
      valueA: { type: "true" },
      valueB: { type: "false" },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(true && false)");
  });

  test("should handle binary or operation", () => {
    const input: ScriptValue = {
      type: "or",
      valueA: { type: "true" },
      valueB: { type: "false" },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(true || false)");
  });

  test("should handle unary not operation", () => {
    const input: ScriptValue = { type: "not", value: { type: "true" } };
    const result = scriptValueToString(input, options);
    expect(result).toBe("!(true)");
  });

  test("should handle right shift operation (shr)", () => {
    const input: ScriptValue = {
      type: "shr",
      valueA: { type: "number", value: 8 },
      valueB: { type: "number", value: 2 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(8 >> 2)");
  });

  test("should handle bitwise AND operation (bAND)", () => {
    const input: ScriptValue = {
      type: "bAND",
      valueA: { type: "number", value: 5 },
      valueB: { type: "number", value: 3 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(5 & 3)");
  });

  test("should handle bitwise OR operation (bOR)", () => {
    const input: ScriptValue = {
      type: "bOR",
      valueA: { type: "number", value: 5 },
      valueB: { type: "number", value: 3 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(5 | 3)");
  });

  test("should handle bitwise XOR operation (bXOR)", () => {
    const input: ScriptValue = {
      type: "bXOR",
      valueA: { type: "number", value: 5 },
      valueB: { type: "number", value: 3 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("(5 ^ 3)");
  });

  test("should handle bitwise NOT operation (bNOT)", () => {
    const input: ScriptValue = {
      type: "bNOT",
      value: { type: "number", value: 5 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("~(5)");
  });

  test("should handle unary abs operation", () => {
    const input: ScriptValue = {
      type: "abs",
      value: { type: "number", value: -5 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("abs(-5)");
  });

  test("should handle unary isqrt operation", () => {
    const input: ScriptValue = {
      type: "isqrt",
      value: { type: "number", value: 9 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("isqrt(9)");
  });

  test("should handle atan2 operation", () => {
    const input: ScriptValue = {
      type: "atan2",
      valueA: { type: "number", value: 1 },
      valueB: { type: "number", value: 1 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("atan2(1,1)");
  });

  test("should handle rnd operation", () => {
    const input: ScriptValue = {
      type: "rnd",
      value: { type: "number", value: 5 },
    };
    const result = scriptValueToString(input, options);
    expect(result).toBe("rnd(5)");
  });

  describe("engine constants", () => {
    test("should format engine constants in expressions", () => {
      const input: ScriptValue = {
        type: "expression",
        value: "@engine::MAX_HEALTH@",
      };
      const result = scriptValueToString(input, options);
      expect(result).toBe("MAX_HEALTH");
    });

    test("should format engine constants with user constants", () => {
      const input: ScriptValue = {
        type: "expression",
        value: "@550e8400-e29b-41d4-a716-446655440000@ + @engine::BONUS@",
      };
      const result = scriptValueToString(input, options);
      expect(result).toContain("BONUS");
      expect(result).toContain(
        "||constant:550e8400-e29b-41d4-a716-446655440000||",
      );
    });

    test("should format engine constants with variables", () => {
      const input: ScriptValue = {
        type: "expression",
        value: "$10$ + @engine::BASE_DAMAGE@",
      };
      const result = scriptValueToString(input, options);
      expect(result).toBe("var_10 + BASE_DAMAGE");
    });

    test("should format complex expressions with engine constants", () => {
      const input: ScriptValue = {
        type: "expression",
        value: "(@engine::MAX_HP@ - $10$) * @engine::MULTIPLIER@",
      };
      const result = scriptValueToString(input, options);
      expect(result).toBe("(MAX_HP - var_10) * MULTIPLIER");
    });

    test("should format engine constants with underscores", () => {
      const input: ScriptValue = {
        type: "expression",
        value: "@engine::PLAYER_MAX_SPEED@",
      };
      const result = scriptValueToString(input, options);
      expect(result).toBe("PLAYER_MAX_SPEED");
    });

    test("should format engine constants with numbers", () => {
      const input: ScriptValue = {
        type: "expression",
        value: "@engine::LEVEL_1_MAX@ + @engine::LEVEL_2_MAX@",
      };
      const result = scriptValueToString(input, options);
      expect(result).toBe("LEVEL_1_MAX + LEVEL_2_MAX");
    });

    test("should handle engine constants in nested expressions", () => {
      const input: ScriptValue = {
        type: "expression",
        value: "abs(@engine::MIN_VALUE@) + max($V0$, @engine::DEFAULT@)",
      };
      const result = scriptValueToString(input, options);
      expect(result).toContain("MIN_VALUE");
      expect(result).toContain("DEFAULT");
      expect(result).toContain("var_V0");
    });
  });
});
