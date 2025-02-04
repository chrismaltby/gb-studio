import { determineUsedAssets } from "lib/compiler/precompile/determineUsedAssets";
import { CustomEvent, FontData } from "shared/lib/entities/entitiesTypes";
import { getTestScriptHandlers } from "../getTestScriptHandlers";
import { dummyProjectResources, dummySceneResource } from "../dummydata";
import {
  FontResource,
  ProjectResources,
  SceneResource,
} from "shared/lib/resources/types";

test("should include default font when provided", async () => {
  const projectData = {
    ...dummyProjectResources,
    fonts: [
      {
        id: "font1",
      },
      {
        id: "font2",
      },
      {
        id: "font3",
      },
    ] as FontData[],
    settings: {
      ...dummyProjectResources.settings,
      defaultFontId: "font2",
    },
  } as ProjectResources;
  const customEventsLookup = {} as Record<string, CustomEvent>;
  const scriptEventHandlers = await getTestScriptHandlers();
  const usedAssets = determineUsedAssets({
    projectData,
    customEventsLookup,
    scriptEventHandlers,
    warnings: () => {},
  });
  expect(usedAssets.referencedFonts).toHaveLength(1);
  expect(usedAssets.referencedFonts[0].id).toBe("font2");
});

test("should include first font when default not provided", async () => {
  const projectData = {
    ...dummyProjectResources,
    fonts: [
      {
        id: "font1",
      },
      {
        id: "font2",
      },
      {
        id: "font3",
      },
    ] as FontData[],
  } as ProjectResources;
  const customEventsLookup = {} as Record<string, CustomEvent>;
  const scriptEventHandlers = await getTestScriptHandlers();
  const usedAssets = determineUsedAssets({
    projectData,
    customEventsLookup,
    scriptEventHandlers,
    warnings: () => {},
  });
  expect(usedAssets.referencedFonts).toHaveLength(1);
  expect(usedAssets.referencedFonts[0].id).toBe("font1");
});

test("should include fonts referenced in gbvm script blocks", async () => {
  const projectData = {
    ...dummyProjectResources,
    fonts: [
      {
        id: "font1",
      },
      {
        id: "font2",
      },
      {
        id: "font3",
      },
    ] as FontData[],
    scenes: [
      {
        ...dummySceneResource,
        id: "scene1",
        script: [
          {
            id: "event1",
            command: "EVENT_GBVM_SCRIPT",
            args: {
              script: "",
              references: [
                {
                  type: "font",
                  id: "font3",
                },
              ],
            },
          },
        ],
      },
    ] as SceneResource[],
  } as ProjectResources;
  const customEventsLookup = {} as Record<string, CustomEvent>;
  const scriptEventHandlers = await getTestScriptHandlers();
  const usedAssets = determineUsedAssets({
    projectData,
    customEventsLookup,
    scriptEventHandlers,
    warnings: () => {},
  });
  expect(usedAssets.referencedFonts).toHaveLength(2);
  expect(usedAssets.referencedFonts[0].id).toBe("font1");
  expect(usedAssets.referencedFonts[1].id).toBe("font3");
});

test("should include fonts referenced in dialogue", async () => {
  const projectData = {
    ...dummyProjectResources,
    fonts: [
      {
        id: "3060ae1a-dde6-47f7-af40-5a28bba5a649",
      },
      {
        id: "88f417f8-829b-47d8-8b41-fcf51a12d18e",
      },
      {
        id: "4bd653f0-e08d-424e-9e5b-c1f3aaa21e47",
      },
    ] as FontResource[],
    scenes: [
      {
        ...dummySceneResource,
        id: "scene1",
        script: [
          {
            command: "EVENT_TEXT",
            args: {
              text: ["!F:4bd653f0-e08d-424e-9e5b-c1f3aaa21e47!"],
              avatarId: "",
            },
            id: "event1",
          },
        ],
      },
    ] as SceneResource[],
  } as ProjectResources;
  const customEventsLookup = {} as Record<string, CustomEvent>;
  const scriptEventHandlers = await getTestScriptHandlers();
  const usedAssets = determineUsedAssets({
    projectData,
    customEventsLookup,
    scriptEventHandlers,
    warnings: () => {},
  });
  expect(usedAssets.referencedFonts).toHaveLength(2);
  expect(usedAssets.referencedFonts[0].id).toBe(
    "3060ae1a-dde6-47f7-af40-5a28bba5a649"
  );
  expect(usedAssets.referencedFonts[1].id).toBe(
    "4bd653f0-e08d-424e-9e5b-c1f3aaa21e47"
  );
});
