import { Value } from "@sinclair/typebox/value";
import { VariablesResource } from "shared/lib/resources/types";
import {
  migrateRawResource,
  migrateRawVariableTypes,
} from "lib/project/migration/rawResourceMigrations";

const oldVariablesResource = {
  _resourceType: "variables",
  variables: [
    {
      id: "5",
      name: "GameProgress",
      symbol: "var_gameprogress",
      flags: {
        flag1: "ScoresToBeatSet",
        flag2: "SeenTutorial",
        flag7: "Theme 8 Unlocked",
      },
    },
  ],
  constants: [],
};

test("Value.Cast drops flags when a variable has no type (regression)", () => {
  const castData = Value.Cast(VariablesResource, oldVariablesResource);
  expect(castData.variables[0].flags).toBeUndefined();
  expect(castData.variables[0].type).toBe("number");
});

test("raw migration preserves flags through Value.Cast for pre-5.0.0 projects", () => {
  const castData = Value.Cast(
    VariablesResource,
    migrateRawResource(oldVariablesResource, "4.2.0", "10"),
  );
  expect(castData.variables[0].type).toBe("number");
  expect(castData.variables[0].flags).toEqual({
    flag1: "ScoresToBeatSet",
    flag2: "SeenTutorial",
    flag7: "Theme 8 Unlocked",
  });
});

test("raw migration does not apply to 5.0.0+ projects", () => {
  const migrated = migrateRawResource(oldVariablesResource, "5.0.0", "1");
  expect(migrated).toBe(oldVariablesResource);
});

test("raw migration only applies to variables resources", () => {
  const sceneResource = { _resourceType: "scene", variables: [{ id: "L0" }] };
  const migrated = migrateRawResource(sceneResource, "4.2.0", "10");
  expect(migrated).toBe(sceneResource);
});

test("raw migration leaves array variables untouched", () => {
  const arrayVariablesResource = {
    _resourceType: "variables",
    variables: [
      {
        id: "6",
        name: "Inventory",
        symbol: "var_inventory",
        type: "array",
        size: 8,
        flags: { flag1: "Equipped" },
      },
    ],
    constants: [],
  };
  const result = migrateRawVariableTypes.migrate(arrayVariablesResource) as {
    variables: unknown[];
  };
  expect(result.variables[0]).toEqual(arrayVariablesResource.variables[0]);

  const castData = Value.Cast(VariablesResource, result);
  expect(castData.variables[0].type).toBe("array");
  expect(castData.variables[0].flags).toEqual({ flag1: "Equipped" });
});
