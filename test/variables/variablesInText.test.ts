import {
  dialogueTokenToVariableId,
  expressionTokenToVariableId,
  variableInDialogueText,
  variableInExpressionText,
} from "shared/lib/variables/variablesInText";

describe("dialogueTokenToVariableId", () => {
  test("should return variable id without leading zero", () => {
    const token = { type: "variable", variableId: "01" } as const;
    expect(dialogueTokenToVariableId(token)).toBe("1");
  });

  test("should return zero first first variable", () => {
    const token = { type: "variable", variableId: "00" } as const;
    expect(dialogueTokenToVariableId(token)).toBe("0");
  });

  test("should not remove trailing zeros", () => {
    const token = { type: "variable", variableId: "500" } as const;
    expect(dialogueTokenToVariableId(token)).toBe("500");
  });
});

describe("expressionTokenToVariableId", () => {
  test("should return variable id without leading zero", () => {
    const token = { type: "VAR", symbol: "$01$" } as const;
    expect(expressionTokenToVariableId(token)).toBe("1");
  });

  test("should return zero first first variable", () => {
    const token = { type: "VAR", symbol: "$00$" } as const;
    expect(expressionTokenToVariableId(token)).toBe("0");
  });

  test("should not remove trailing zeros", () => {
    const token = { type: "VAR", symbol: "$500$" } as const;
    expect(expressionTokenToVariableId(token)).toBe("500");
  });
});

describe("variableInDialogueText", () => {
  test("should match when variable contains leading zero", () => {
    const text = "Value is $01$";
    expect(variableInDialogueText("1", text)).toBeTruthy();
  });

  test("should match when variable contains is zero", () => {
    const text = "Value is $00$";
    expect(variableInDialogueText("0", text)).toBeTruthy();
  });

  test("should match when variable contains trailing zeros", () => {
    const text = "Value is $500$";
    expect(variableInDialogueText("500", text)).toBeTruthy();
  });

  test("should match when multiple variables are found", () => {
    const text = "Value is $01$ $02$ $03$";
    expect(variableInDialogueText("3", text)).toBeTruthy();
  });

  test("should not match when variable isn't in text", () => {
    const text = "Value is $02$";
    expect(variableInDialogueText("3", text)).toBeFalsy();
  });
});

describe("variableInExpressionText", () => {
  test("should match when variable contains leading zero", () => {
    const text = "5 + $01$";
    expect(variableInExpressionText("1", text)).toBeTruthy();
  });

  test("should match when variable contains is zero", () => {
    const text = "5 + $00$";
    expect(variableInExpressionText("0", text)).toBeTruthy();
  });

  test("should match when variable contains trailing zeros", () => {
    const text = "5 + $500$";
    expect(variableInExpressionText("500", text)).toBeTruthy();
  });

  test("should match when multiple variables are found", () => {
    const text = "$01$ + $02$ - $03$";
    expect(variableInExpressionText("3", text)).toBeTruthy();
  });

  test("should not match when variable isn't in text", () => {
    const text = "5 + $02$";
    expect(variableInExpressionText("3", text)).toBeFalsy();
  });
});
