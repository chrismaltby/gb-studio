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
    lexText("OldFont!F:0c7c1705-dab6-476e-a5ce-17de23b3d591!NewFont"),
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

test("should provide empty previewValue for unmatched octal codes", () => {
  expect(lexText("Before\\003After")).toEqual([
    {
      type: "text",
      value: "Before",
    },
    {
      type: "text",
      value: "\\003",
      previewValue: "",
    },
    {
      type: "text",
      value: "After",
    },
  ]);
});

test("should provide escaped previewValue for octal escape codes", () => {
  expect(lexText("Before\\005\\012After")).toEqual([
    {
      type: "text",
      value: "Before",
    },
    {
      type: "text",
      value: "\\005\\012",
      previewValue: "\n",
    },
    {
      type: "text",
      value: "After",
    },
  ]);
});

test("should provide escaped previewValue for octal escape codes + non octal escaped character", () => {
  expect(lexText("Before\\005CAfter")).toEqual([
    {
      type: "text",
      value: "Before",
    },
    {
      type: "text",
      value: "\\005C",
      previewValue: "C",
    },
    {
      type: "text",
      value: "After",
    },
  ]);
});

test("should provide previewValue for octal codes outside of control code range", () => {
  expect(lexText('Before\\042"After')).toEqual([
    {
      type: "text",
      value: "Before",
    },
    {
      type: "text",
      value: "\\042",
      previewValue: '"',
    },
    {
      type: "text",
      value: '"After',
    },
  ]);
});

test("should provide previewValue for characters with codes beyond 128", () => {
  expect(lexText("Before\\251After")).toEqual([
    {
      type: "text",
      value: "Before",
    },
    {
      type: "text",
      value: "\\251",
      previewValue: "©",
    },
    {
      type: "text",
      value: "After",
    },
  ]);
});
