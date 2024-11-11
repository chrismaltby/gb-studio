import { lexText } from "shared/lib/compiler/lexText";

test("should support fixed length variable printf token", () => {
  expect(lexText("Var = %D4$L0$")).toEqual([
    {
      type: "text",
      value: "Var = ",
    },
    {
      type: "variable",
      variableId: "L0",
      fixedLength: 4,
    },
  ]);
});

test("should support variable length variable printf token", () => {
  expect(lexText("Var = %d$L0$")).toEqual([
    {
      type: "text",
      value: "Var = ",
    },
    {
      type: "variable",
      variableId: "L0",
    },
  ]);
});

test("should support variable without printf token", () => {
  expect(lexText("Var = $L0$")).toEqual([
    {
      type: "text",
      value: "Var = ",
    },
    {
      type: "variable",
      variableId: "L0",
    },
  ]);
});

test("should support character code printf token", () => {
  expect(lexText("Var = %c$L0$")).toEqual([
    {
      type: "text",
      value: "Var = ",
    },
    {
      type: "char",
      variableId: "L0",
    },
  ]);
});

test("should support old style character code", () => {
  expect(lexText("Var = #L0#")).toEqual([
    {
      type: "text",
      value: "Var = ",
    },
    {
      type: "char",
      variableId: "L0",
    },
  ]);
});

test("should support text speed variable printf token", () => {
  expect(lexText("OldSpeed%t$L0$NewSpeed")).toEqual([
    {
      type: "text",
      value: "OldSpeed",
    },
    {
      type: "speedVariable",
      variableId: "L0",
    },
    {
      type: "text",
      value: "NewSpeed",
    },
  ]);
});

test("should support text font variable printf token", () => {
  expect(lexText("OldFont%f$L0$NewFont")).toEqual([
    {
      type: "text",
      value: "OldFont",
    },
    {
      type: "fontVariable",
      variableId: "L0",
    },
    {
      type: "text",
      value: "NewFont",
    },
  ]);
});

test("should support speed code tokens", () => {
  expect(lexText("OldSpeed!S3!NewSpeed")).toEqual([
    {
      type: "text",
      value: "OldSpeed",
    },
    {
      type: "speed",
      speed: 3,
    },
    {
      type: "text",
      value: "NewSpeed",
    },
  ]);
});

test("should support font tokens", () => {
  expect(
    lexText("OldFont!F:0c7c1705-dab6-476e-a5ce-17de23b3d591!NewFont")
  ).toEqual([
    {
      type: "text",
      value: "OldFont",
    },
    {
      type: "font",
      fontId: "0c7c1705-dab6-476e-a5ce-17de23b3d591",
    },
    {
      type: "text",
      value: "NewFont",
    },
  ]);
});

test("should support wait code tokens", () => {
  expect(lexText("Before!W:5f!After")).toEqual([
    {
      type: "text",
      value: "Before",
    },
    {
      type: "wait",
      time: 5,
      units: "frames",
      frames: 5,
    },
    {
      type: "text",
      value: "After",
    },
  ]);
});

test("should preserve newlines after wait code tokens", () => {
  expect(lexText("Before!W:5f!\nAfter")).toEqual([
    {
      type: "text",
      value: "Before",
    },
    {
      type: "wait",
      time: 5,
      units: "frames",
      frames: 5,
    },
    {
      type: "text",
      value: "\nAfter",
    },
  ]);
});
