import shuntingYard from "shared/lib/rpn/shuntingYard";
import { Token } from "shared/lib/rpn/types";

test("should add two values", () => {
  const input: Token[] = [
    { type: "VAL", value: 5 },
    { type: "OP", operator: "+" },
    { type: "VAL", value: 6 },
  ];
  expect(shuntingYard(input)).toEqual([
    { type: "VAL", value: 5 },
    { type: "VAL", value: 6 },
    { type: "OP", operator: "+" },
  ]);
});

test("should multiply two values", () => {
  const input: Token[] = [
    { type: "VAL", value: 5 },
    { type: "OP", operator: "*" },
    { type: "VAL", value: 6 },
  ];
  expect(shuntingYard(input)).toEqual([
    { type: "VAL", value: 5 },
    { type: "VAL", value: 6 },
    { type: "OP", operator: "*" },
  ]);
});

test("should throw when not enough input to multiply values", () => {
  const input: Token[] = [
    { type: "OP", operator: "*" },
    { type: "VAL", value: 6 },
  ];
  const input2: Token[] = [
    { type: "VAL", value: 6 },
    { type: "OP", operator: "*" },
  ];
  expect(() => shuntingYard(input)).toThrow(/Not enough operands/);
  expect(() => shuntingYard(input2)).toThrow(/Not enough operands/);
});

test("should throw invalid expression when multiple values will be on stack", () => {
  const input: Token[] = [
    { type: "VAL", value: 6 },
    { type: "VAL", value: 6 },
  ];
  expect(() => shuntingYard(input)).toThrow(/Invalid expression/);
});

test("should throw when calling variable as a function", () => {
  const input: Token[] = [
    { type: "VAR", symbol: "0" },
    { type: "LBRACE" },
    { type: "VAL", value: 6 },
    { type: "RBRACE" },
  ];
  expect(() => shuntingYard(input)).toThrow(/not a function/);
});

test("should throw when calling value as a function", () => {
  const input: Token[] = [
    { type: "VAL", value: 4 },
    { type: "LBRACE" },
    { type: "VAL", value: 6 },
    { type: "RBRACE" },
  ];
  expect(() => shuntingYard(input)).toThrow(/not a function/);
});

test("should return 0 value for empty input", () => {
  const input: Token[] = [];
  expect(shuntingYard(input)).toEqual([{ type: "VAL", value: 0 }]);
});

test("should throw mismatched parenthesis", () => {
  const input: Token[] = [
    { type: "LBRACE" },
    { type: "LBRACE" },
    { type: "RBRACE" },
  ];
  const input2: Token[] = [
    { type: "LBRACE" },
    { type: "RBRACE" },
    { type: "RBRACE" },
  ];
  expect(() => shuntingYard(input)).toThrow(/Mismatched parenthesis/);
  expect(() => shuntingYard(input2)).toThrow(/Mismatched parenthesis/);
});

test("should handle engine constants", () => {
  const input: Token[] = [
    { type: "CONST", symbol: "engine::MAX_HEALTH" },
    { type: "OP", operator: "+" },
    { type: "VAL", value: 10 },
  ];
  expect(shuntingYard(input)).toEqual([
    { type: "CONST", symbol: "engine::MAX_HEALTH" },
    { type: "VAL", value: 10 },
    { type: "OP", operator: "+" },
  ]);
});

test("should handle engine constants with user constants", () => {
  const input: Token[] = [
    { type: "CONST", symbol: "550e8400-e29b-41d4-a716-446655440000" },
    { type: "OP", operator: "*" },
    { type: "CONST", symbol: "engine::MULTIPLIER" },
  ];
  expect(shuntingYard(input)).toEqual([
    { type: "CONST", symbol: "550e8400-e29b-41d4-a716-446655440000" },
    { type: "CONST", symbol: "engine::MULTIPLIER" },
    { type: "OP", operator: "*" },
  ]);
});
