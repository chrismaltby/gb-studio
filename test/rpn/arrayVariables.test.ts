import tokenizer from "shared/lib/rpn/tokenizer";

test("tokenizes a variable with a static array index", () => {
  expect(tokenizer("$11111111-1111-1111-1111-111111111111$[12]")).toEqual([
    {
      type: "VAR",
      symbol: "$11111111-1111-1111-1111-111111111111$",
      index: [{ type: "VAL", value: 12 }],
    },
  ]);
});

test("tokenizes a variable with a variable array index", () => {
  expect(
    tokenizer(
      "$11111111-1111-1111-1111-111111111111$[$22222222-2222-2222-2222-222222222222$]",
    ),
  ).toEqual([
    {
      type: "VAR",
      symbol: "$11111111-1111-1111-1111-111111111111$",
      index: [
        {
          type: "VAR",
          symbol: "$22222222-2222-2222-2222-222222222222$",
        },
      ],
    },
  ]);
});

test("tokenizes a variable with a constant array index", () => {
  expect(
    tokenizer(
      "$11111111-1111-1111-1111-111111111111$[@33333333-3333-3333-3333-333333333333@]",
    ),
  ).toEqual([
    {
      type: "VAR",
      symbol: "$11111111-1111-1111-1111-111111111111$",
      index: [
        {
          type: "CONST",
          symbol: "33333333-3333-3333-3333-333333333333",
        },
      ],
    },
  ]);
});

test("tokenizes a variable with an engine constant array index", () => {
  expect(
    tokenizer("$11111111-1111-1111-1111-111111111111$[@engine::ARRAY_INDEX@]"),
  ).toEqual([
    {
      type: "VAR",
      symbol: "$11111111-1111-1111-1111-111111111111$",
      index: [
        {
          type: "CONST",
          symbol: "engine::ARRAY_INDEX",
        },
      ],
    },
  ]);
});

test("tokenizes an array index expression", () => {
  expect(
    tokenizer(
      "$11111111-1111-1111-1111-111111111111$[$22222222-2222-2222-2222-222222222222$ + 1]",
    ),
  ).toEqual([
    {
      type: "VAR",
      symbol: "$11111111-1111-1111-1111-111111111111$",
      index: [
        {
          type: "VAR",
          symbol: "$22222222-2222-2222-2222-222222222222$",
        },
        { type: "OP", operator: "+" },
        { type: "VAL", value: 1 },
      ],
    },
  ]);
});

test("tokenizes nested indexed variables in an array index", () => {
  expect(
    tokenizer(
      "$11111111-1111-1111-1111-111111111111$[$22222222-2222-2222-2222-222222222222$[$33333333-3333-3333-3333-333333333333$] + $44444444-4444-4444-4444-444444444444$]",
    ),
  ).toEqual([
    {
      type: "VAR",
      symbol: "$11111111-1111-1111-1111-111111111111$",
      index: [
        {
          type: "VAR",
          symbol: "$22222222-2222-2222-2222-222222222222$",
          index: [
            {
              type: "VAR",
              symbol: "$33333333-3333-3333-3333-333333333333$",
            },
          ],
        },
        { type: "OP", operator: "+" },
        {
          type: "VAR",
          symbol: "$44444444-4444-4444-4444-444444444444$",
        },
      ],
    },
  ]);
});
