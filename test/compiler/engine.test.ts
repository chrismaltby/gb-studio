import { engineRoot } from "consts";
import { isKnownEngineVersion } from "lib/project/ejectEngineChangelog";
import { readEngineVersion } from "lib/project/engine";

test("should recognise current engine version", async () => {
  const corePath = `${engineRoot}/gb`;
  const engineMetaPath = `${corePath}/engine.json`;
  const latestEngineVersion = await readEngineVersion(engineMetaPath);
  expect(isKnownEngineVersion(latestEngineVersion)).toBe(true);
});

test("should recognise old engine version", () => {
  expect(isKnownEngineVersion("3.3.0-e3")).toBe(true);
});

test("should not recognise future engine version", () => {
  expect(isKnownEngineVersion("20X6")).toBe(false);
});
