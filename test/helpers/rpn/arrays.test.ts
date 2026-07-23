import tokenize from "shared/lib/rpn/tokenizer";
import {
  extractArrayAccesses,
  parseExpressionStatement,
  expressionArrayNames,
  matchesArrayName,
  renameArrayInExpressionText,
} from "shared/lib/rpn/arrays";

describe("tokenizer array support", () => {
  test("should tokenize brackets and assignment", () => {
    expect(tokenize("Arr[0] = 5")).toEqual([
      { type: "VAR", symbol: "Arr" },
      { type: "LBRACKET" },
      { type: "VAL", value: 0 },
      { type: "RBRACKET" },
      { type: "ASSIGN" },
      { type: "VAL", value: 5 },
    ]);
  });

  test("should support unary negation after assignment and bracket", () => {
    expect(tokenize("$00$ = -5")).toEqual([
      { type: "VAR", symbol: "$00$" },
      { type: "ASSIGN" },
      { type: "OP", operator: "neg" },
      { type: "VAL", value: 5 },
    ]);
    expect(tokenize("Arr[-1]")).toEqual([
      { type: "VAR", symbol: "Arr" },
      { type: "LBRACKET" },
      { type: "OP", operator: "neg" },
      { type: "VAL", value: 1 },
      { type: "RBRACKET" },
    ]);
  });
});

describe("extractArrayAccesses", () => {
  test("should extract a constant index array access", () => {
    const parsed = extractArrayAccesses(tokenize("1 + Arr[2]"));
    expect(parsed.tokens).toEqual([
      { type: "VAL", value: 1 },
      { type: "OP", operator: "+" },
      { type: "ARRAYVAL", id: 0 },
    ]);
    expect(parsed.arrayAccesses).toHaveLength(1);
    expect(parsed.arrayAccesses[0].name).toBe("Arr");
    expect(parsed.arrayAccesses[0].index.tokens).toEqual([
      { type: "VAL", value: 2 },
    ]);
  });

  test("should extract a variable index array access", () => {
    const parsed = extractArrayAccesses(tokenize("Arr[$05$]"));
    expect(parsed.tokens).toEqual([{ type: "ARRAYVAL", id: 0 }]);
    expect(parsed.arrayAccesses[0].index.tokens).toEqual([
      { type: "VAR", symbol: "$05$" },
    ]);
  });

  test("should extract nested array accesses innermost first", () => {
    const parsed = extractArrayAccesses(tokenize("Outer[Inner[1]]"));
    expect(parsed.tokens).toEqual([{ type: "ARRAYVAL", id: 1 }]);
    expect(parsed.arrayAccesses).toHaveLength(1);
    const outer = parsed.arrayAccesses[0];
    expect(outer.name).toBe("Outer");
    expect(outer.id).toBe(1);
    expect(outer.index.tokens).toEqual([{ type: "ARRAYVAL", id: 0 }]);
    expect(outer.index.arrayAccesses[0].name).toBe("Inner");
  });

  test("should throw for missing index", () => {
    expect(() => extractArrayAccesses(tokenize("Arr[]"))).toThrow(
      /Missing array index/,
    );
  });

  test("should throw for unmatched brackets", () => {
    expect(() => extractArrayAccesses(tokenize("Arr[1"))).toThrow(
      /Missing "\]"/,
    );
    expect(() => extractArrayAccesses(tokenize("1]"))).toThrow(
      /Unexpected "\]"/,
    );
  });
});

describe("expressionArrayNames", () => {
  test("should collect all array names including nested and assignment targets", () => {
    expect(expressionArrayNames("Target[Inner[0]] = Other[1] + 2")).toEqual([
      "Other",
      "Target",
      "Inner",
    ]);
  });

  test("should return empty list for expressions without arrays", () => {
    expect(expressionArrayNames("$00$ + 1")).toEqual([]);
  });

  test("should return empty list for invalid expressions", () => {
    expect(expressionArrayNames("Arr[")).toEqual([]);
  });
});

describe("matchesArrayName", () => {
  test("should match by full path or basename ignoring case and whitespace", () => {
    expect(matchesArrayName("MyArray", "My Array")).toBe(true);
    expect(matchesArrayName("myarray", "Parent/My Array")).toBe(true);
    expect(matchesArrayName("Parent/MyArray", "Parent/My Array")).toBe(true);
    expect(matchesArrayName("Other", "My Array")).toBe(false);
  });
});

describe("renameArrayInExpressionText", () => {
  test("should rename array accesses preserving surrounding text", () => {
    expect(renameArrayInExpressionText("Old[0] + $05$", "Old", "New")).toBe(
      "New[0] + $05$",
    );
  });

  test("should rename assignment targets and nested accesses", () => {
    expect(
      renameArrayInExpressionText("Old[Old[1]] = Other[0]", "Old", "New"),
    ).toBe("New[New[1]] = Other[0]");
  });

  test("should match names containing spaces and folder paths", () => {
    expect(
      renameArrayInExpressionText("My Array[0] + 1", "Parent/My Array", "New"),
    ).toBe("New[0] + 1");
  });

  test("should leave unrelated names and non-array text untouched", () => {
    expect(renameArrayInExpressionText("Other[0] + 1", "Old", "New")).toBe(
      "Other[0] + 1",
    );
    expect(renameArrayInExpressionText("min(1, 2)", "min", "New")).toBe(
      "min(1, 2)",
    );
  });
});

describe("parseExpressionStatement", () => {
  test("should parse a plain expression without assignment", () => {
    const statement = parseExpressionStatement(tokenize("1 + 2"));
    expect(statement.target).toBeUndefined();
    expect(statement.value.tokens).toEqual([
      { type: "VAL", value: 1 },
      { type: "OP", operator: "+" },
      { type: "VAL", value: 2 },
    ]);
  });

  test("should parse a variable assignment", () => {
    const statement = parseExpressionStatement(tokenize("$00$ = Arr[3] + 1"));
    expect(statement.target).toEqual({ type: "variable", symbol: "$00$" });
    expect(statement.value.arrayAccesses).toHaveLength(1);
    expect(statement.value.arrayAccesses[0].name).toBe("Arr");
  });

  test("should parse an array item assignment", () => {
    const statement = parseExpressionStatement(tokenize("Arr[$02$] = 5"));
    expect(statement.target?.type).toBe("array");
    if (statement.target?.type === "array") {
      expect(statement.target.name).toBe("Arr");
      expect(statement.target.index.tokens).toEqual([
        { type: "VAR", symbol: "$02$" },
      ]);
    }
    expect(statement.value.tokens).toEqual([{ type: "VAL", value: 5 }]);
  });

  test("should not treat comparison operators as assignment", () => {
    const statement = parseExpressionStatement(tokenize("$00$ == 5"));
    expect(statement.target).toBeUndefined();
  });

  test("should throw for multiple assignments", () => {
    expect(() => parseExpressionStatement(tokenize("$00$ = $01$ = 5"))).toThrow(
      /single "="/,
    );
  });

  test("should throw for invalid assignment targets", () => {
    expect(() => parseExpressionStatement(tokenize("1 = 5"))).toThrow(
      /Left side/,
    );
    expect(() => parseExpressionStatement(tokenize("Arr = 5"))).toThrow(
      /Left side/,
    );
    expect(() => parseExpressionStatement(tokenize("$00$ + 1 = 5"))).toThrow(
      /Left side/,
    );
  });

  test("should throw for missing value after assignment", () => {
    expect(() => parseExpressionStatement(tokenize("$00$ ="))).toThrow(
      /Missing value/,
    );
  });
});
