import {
  compileGameGlobalsHeader,
  parallaxStep,
  toASMCollisionGroup,
} from "lib/compiler/generateGBVMData";
import { CollisionExtraFlag } from "shared/lib/resources/types";

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
      { PLATFORM_CONST_1: 5 },
      ["STATE_DEFAULT", "STATE_EXPLODE", "STATE_OPEN"],
    );
    expect(output).toInclude("VAR_1 0");
    expect(output).toInclude("VAR_2 1");
    expect(output).toInclude("MAX_GLOBAL_VARS 2");
    expect(output).toInclude("CONST_0 0");
    expect(output).toInclude("CONST_1 64");
    expect(output).toInclude("PLATFORM_CONST_1 5");
    expect(output).toInclude("STATE_DEFAULT 0");
    expect(output).toInclude("STATE_EXPLODE 1");
    expect(output).toInclude("STATE_OPEN 2");
  });
});

describe("parallaxStep", () => {
  test("should convert parallax inputs to gbvm macro string", () => {
    expect(parallaxStep(0, 5, 5)).toBe("PARALLAX_STEP(0, 5, 5)");
  });

  test("should wrap parallax speeds to within signed 8-bit range", () => {
    expect(parallaxStep(4, 8, 128)).toBe("PARALLAX_STEP(4, 8, -128)");
  });
});

describe("toASMCollisionGroup", () => {
  test("should generate correct collision groups", () => {
    expect(toASMCollisionGroup("player")).toBe("COLLISION_GROUP_PLAYER");
    expect(toASMCollisionGroup("1")).toBe("COLLISION_GROUP_1");
    expect(toASMCollisionGroup("2")).toBe("COLLISION_GROUP_2");
    expect(toASMCollisionGroup("3")).toBe("COLLISION_GROUP_3");
  });

  test("should generate none collision groups if invalid collision group", () => {
    expect(toASMCollisionGroup("INVALID_COLLISION_GROUP")).toBe(
      "COLLISION_GROUP_NONE",
    );
  });

  test("should concatenate extras flags correctly", () => {
    expect(toASMCollisionGroup("1", ["1"])).toBe(
      "COLLISION_GROUP_1 | COLLISION_GROUP_FLAG_1",
    );
    expect(toASMCollisionGroup("1", ["2", "3"])).toBe(
      "COLLISION_GROUP_1 | COLLISION_GROUP_FLAG_2 | COLLISION_GROUP_FLAG_3",
    );
  });

  test("should ignore invalid extras flags correctly and generate a valid ASM", () => {
    const invalidFlag1 = "" as CollisionExtraFlag;
    const invalidFlag2 = "invalid_flag" as CollisionExtraFlag;

    expect(toASMCollisionGroup("1", [invalidFlag1])).toBe("COLLISION_GROUP_1");
    expect(toASMCollisionGroup("1", [invalidFlag2])).toBe("COLLISION_GROUP_1");
    expect(toASMCollisionGroup("1", [invalidFlag1, invalidFlag2])).toBe(
      "COLLISION_GROUP_1",
    );
    expect(toASMCollisionGroup("1", ["1", invalidFlag2])).toBe(
      "COLLISION_GROUP_1 | COLLISION_GROUP_FLAG_1",
    );
  });
});
