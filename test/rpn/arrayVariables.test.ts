import tokenizer from "shared/lib/rpn/tokenizer";

test("tokenizes a variable with a static array index", () => {
  expect(tokenizer("$11111111-1111-1111-1111-111111111111$[12]")).toEqual([
    {
      type: "VAR",
      symbol: "$11111111-1111-1111-1111-111111111111$",
      index: { type: "VAL", value: 12 },
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
      index: {
        type: "VAR",
        symbol: "$22222222-2222-2222-2222-222222222222$",
      },
    },
  ]);
});
