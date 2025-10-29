import tokenizer from "../../src/shared/lib/rpn/tokenizer";
import { isConstant } from "../../src/shared/lib/rpn/helpers";

describe("RPN Engine Constants", () => {
  describe("tokenizer", () => {
    test("should tokenize engine constants", () => {
      const tokens = tokenizer("@engine::MAX_HEALTH@");
      expect(tokens).toEqual([{ type: "CONST", symbol: "engine::MAX_HEALTH" }]);
    });

    test("should tokenize engine constants in expressions", () => {
      const tokens = tokenizer("@engine::MAX_HEALTH@ + 10");
      expect(tokens).toEqual([
        { type: "CONST", symbol: "engine::MAX_HEALTH" },
        { type: "OP", operator: "+" },
        { type: "VAL", value: 10 },
      ]);
    });

    test("should tokenize engine constants with underscores", () => {
      const tokens = tokenizer("@engine::PLAYER_MAX_SPEED@");
      expect(tokens).toEqual([
        { type: "CONST", symbol: "engine::PLAYER_MAX_SPEED" },
      ]);
    });

    test("should tokenize engine constants with numbers", () => {
      const tokens = tokenizer("@engine::LEVEL_1_MAX@");
      expect(tokens).toEqual([
        { type: "CONST", symbol: "engine::LEVEL_1_MAX" },
      ]);
    });

    test("should tokenize mixed user and engine constants", () => {
      const tokens = tokenizer(
        "@550e8400-e29b-41d4-a716-446655440000@ + @engine::BONUS@",
      );
      expect(tokens).toEqual([
        { type: "CONST", symbol: "550e8400-e29b-41d4-a716-446655440000" },
        { type: "OP", operator: "+" },
        { type: "CONST", symbol: "engine::BONUS" },
      ]);
    });

    test("should tokenize complex expression with engine constants", () => {
      const tokens = tokenizer(
        "(@engine::MAX_HP@ - $10$) * @engine::MULTIPLIER@",
      );
      expect(tokens).toEqual([
        { type: "LBRACE" },
        { type: "CONST", symbol: "engine::MAX_HP" },
        { type: "OP", operator: "-" },
        { type: "VAR", symbol: "$10$" },
        { type: "RBRACE" },
        { type: "OP", operator: "*" },
        { type: "CONST", symbol: "engine::MULTIPLIER" },
      ]);
    });
  });

  describe("isConstant", () => {
    test("should identify engine constants", () => {
      expect(isConstant("@engine::MAX_HEALTH@")).toBe(true);
    });

    test("should identify user constants", () => {
      expect(isConstant("@550e8400-e29b-41d4-a716-446655440000@")).toBe(true);
    });

    test("should not identify variables as constants", () => {
      expect(isConstant("$10$")).toBe(false);
    });

    test("should not identify numbers as constants", () => {
      expect(isConstant("42")).toBe(false);
    });

    test("should identify engine constants with complex names", () => {
      expect(isConstant("@engine::PLAYER_JUMP_HEIGHT_MAX@")).toBe(true);
    });
  });
});
