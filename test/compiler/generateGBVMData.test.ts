import { compileGameGlobalsHeader } from "lib/compiler/generateGBVMData";

describe("compileGameGlobalsHeader", () => {
  test("should include variables, constants and state references in global header", () => {
    const output = compileGameGlobalsHeader(
      {
        var1: {
          id: "var1",
          name: "Variable 1",
          symbol: "VAR_1",
          isLocal: false,
          entityType: "scene",
          entityId: "",
          sceneId: "",
        },
        var2: {
          id: "var2",
          name: "Variable 2",
          symbol: "VAR_2",
          isLocal: false,
          entityType: "scene",
          entityId: "",
          sceneId: "",
        },
      },
      [
        {
          symbol: "CONST_0",
          id: "const0",
          name: "Constant 0",
          value: 0,
        },
        {
          symbol: "CONST_1",
          id: "const1",
          name: "Constant 1",
          value: 64,
        },
      ],
      ["STATE_DEFAULT", "STATE_EXPLODE", "STATE_OPEN"]
    );
    expect(output).toInclude("VAR_1 0");
    expect(output).toInclude("VAR_2 1");
    expect(output).toInclude("MAX_GLOBAL_VARS 2");
    expect(output).toInclude("CONST_0 0");
    expect(output).toInclude("CONST_1 64");
    expect(output).toInclude("STATE_DEFAULT 0");
    expect(output).toInclude("STATE_EXPLODE 1");
    expect(output).toInclude("STATE_OPEN 2");
  });
});
