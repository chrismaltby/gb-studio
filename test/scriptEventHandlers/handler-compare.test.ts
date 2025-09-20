import glob from "glob";
import { promisify } from "util";
import { readFile, remove, writeFile } from "fs-extra";
import { PrecompiledScene } from "lib/compiler/generateGBVMData";
import ScriptBuilder, {
  ScriptBuilderOptions,
} from "lib/compiler/scriptBuilder";
import {
  dummyFontResource,
  dummyPrecompiledBackground,
  dummyPrecompiledSpriteSheet,
} from "../dummydata";
import { ScriptEventHandlers } from "lib/scriptEventsHandlers/handlerTypes";
import { getTestScriptHandlers } from "../getTestScriptHandlers";
import {
  loadScriptEventHandlerFromUntrustedString,
  QuickJS,
} from "lib/scriptEventsHandlers/untrustedHandler";
import { loadScriptEventHandlerFromTrustedString } from "lib/scriptEventsHandlers/trustedHandler";
import { TestQuickJSWASMModule } from "quickjs-emscripten-core";
import { clearL10NData, setL10NData } from "shared/lib/lang/l10n";
import en from "lang/en.json";
import { basename, join } from "path";
import { PrecompiledFontData } from "lib/compiler/compileFonts";
import { ScriptEvent } from "shared/lib/entities/entitiesTypes";
import { compileEventsWithScriptBuilder } from "lib/compiler/compileEntityEvents";
import { stripCommentsFromGBVMScript } from "lib/compiler/gbvm/buildHelpers";

const globAsync = promisify(glob);

const matchIncludes = (substring: string): RegExp => {
  return new RegExp(substring, "s");
};

const matchExcludes = (substring: string): RegExp => {
  return new RegExp(`^(?!.*${substring}).*$`, "s");
};

describe("Compare output from trusted and untrusted plugin handlers", () => {
  let scriptEventHandlers: ScriptEventHandlers = {};

  const mockTruePath = jest.fn();
  const mockFalsePath = jest.fn();

  beforeAll(async () => {
    scriptEventHandlers = await getTestScriptHandlers();
    setL10NData(en);
    const exportPaths = await globAsync(join(__dirname, "_tmp/*.s"));
    for (const exportPath of exportPaths) {
      await remove(exportPath);
    }
    mockTruePath.mockReset();
    mockFalsePath.mockReset();
  });

  afterEach(async () => {
    const qjs = await QuickJS;
    const testQJS = new TestQuickJSWASMModule(qjs);
    testQJS.assertNoMemoryAllocated();
  });

  afterAll(() => {
    clearL10NData();
  });

  const input = [
    // Timer/Wait Events
    [
      "src/lib/events/eventWait.js",
      {
        input: {
          frames: { type: "number", value: 1 },
          units: "frames",
        },
        exportSuffix: "idle",
        // Single frame wait should use idle cmd
        expectedScriptMatches: [
          matchIncludes("VM_IDLE"),
          matchExcludes("wait_frames"),
        ],
      },
    ],
    [
      "src/lib/events/eventWait.js",
      {
        input: {
          frames: { type: "number", value: 3 },
          units: "frames",
        },
        exportSuffix: "idle_multi",
        // Small number of frame wait should use multiple idle cmd
        expectedScriptMatches: [
          matchIncludes("VM_IDLE"),
          matchExcludes("wait_frames"),
        ],
      },
    ],
    [
      "src/lib/events/eventWait.js",
      {
        input: {
          time: { type: "number", value: 0.5 },
          units: "time",
        },
        exportSuffix: "call",
        // Multi frame wait should use wait_frames call
        expectedScriptMatches: [
          matchIncludes("VM_INVOKE[ ]*b_wait_frames"),
          matchExcludes("VM_IDLE"),
        ],
      },
    ],

    // Actor Movement Events
    [
      "src/lib/events/eventActorMoveTo.js",
      {
        input: {
          actorId: "player",
          x: { type: "number", value: 2 },
          y: { type: "number", value: 17 },
          collideWith: ["walls"],
          moveType: "horizontal",
          units: "tiles",
        },
        expectedScriptMatches: [matchIncludes("VM_ACTOR_MOVE_TO")],
      },
    ],
    [
      "src/lib/events/eventActorSetPosition.js",
      {
        input: {
          actorId: "$self$",
          x: { type: "number", value: 5 },
          y: { type: "number", value: 10 },
          units: "tiles",
        },
      },
    ],
    [
      "src/lib/events/eventActorMoveRelative.js",
      {
        input: {
          actorId: "player",
          x: { type: "number", value: 1 },
          y: { type: "number", value: 0 },
          collideWith: ["walls"],
          moveType: "horizontal",
          units: "tiles",
        },
        expectedScriptMatches: [
          matchIncludes("VM_ACTOR_MOVE_TO"),
          matchIncludes(".ACTOR_ATTR_RELATIVE_SNAP_TILE"),
        ],
      },
    ],

    // Actor State Events
    [
      "src/lib/events/eventActorShow.js",
      {
        input: {
          actorId: "$self$",
        },
        expectedScriptMatches: [
          matchIncludes("VM_ACTOR_SET_HIDDEN[ ]*.LOCAL_ACTOR, 0"),
        ],
      },
    ],
    [
      "src/lib/events/eventActorHide.js",
      {
        input: {
          actorId: "$self$",
        },
        expectedScriptMatches: [
          matchIncludes("VM_ACTOR_SET_HIDDEN[ ]*.LOCAL_ACTOR, 1"),
        ],
      },
    ],
    [
      "src/lib/events/eventActorSetDirection.js",
      {
        input: {
          actorId: "$self$",
          direction: { type: "direction", value: "down" },
        },
        exportSuffix: "down",
        expectedScriptMatches: [
          matchIncludes("VM_ACTOR_SET_DIR[ ]*.LOCAL_ACTOR, .DIR_DOWN"),
        ],
      },
    ],
    [
      "src/lib/events/eventActorSetDirection.js",
      {
        input: {
          actorId: "$self$",
          direction: { type: "direction", value: "up" },
        },
        exportSuffix: "up",
        expectedScriptMatches: [
          matchIncludes("VM_ACTOR_SET_DIR[ ]*.LOCAL_ACTOR, .DIR_UP"),
        ],
      },
    ],

    // Tile Events
    [
      "src/lib/events/eventReplaceTileXYSequence.js",
      {
        input: {
          x: { type: "number", value: 22 },
          y: { type: "number", value: 6 },
          tileIndex: { type: "number", value: 0 },
          variable: "L0",
          tilesetId: "tileset1",
          frames: { type: "number", value: 4 },
        },
      },
    ],

    // Custom Event
    [
      "src/lib/events/eventCallCustomEvent.js",
      {
        input: {
          customEventId: "customEvent1",
          "$variable[V0]$": {
            type: "variable",
            value: "L0",
          },
        },
        testPostUpdate: [
          {
            key: "customEventId",
            prevArgs: {
              customEventId: "customEvent1",
              value: "KEEP",
            },
            newArgs: {
              customEventId: "customEvent1",
              value: "KEEP",
            },
            expected: {
              customEventId: "customEvent1",
              value: "KEEP",
            },
          },
          {
            key: "customEventId",
            prevArgs: {
              customEventId: "customEvent1",
              value: "KEEP",
            },
            newArgs: {
              customEventId: "customEvent2",
              value: "KEEP",
            },
            expected: {
              customEventId: "customEvent2",
            },
          },
        ],
        options: {
          customEvents: [
            {
              id: "customEvent1",
              variables: {
                V0: {
                  id: "V0",
                  name: "Variable A",
                  passByReference: true,
                },
              },
              actors: {},
              symbol: "script_1",
              script: [
                {
                  command: "EVENT_INC_VALUE",
                  args: {
                    variable: "V0",
                  },
                },
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: ["Hello $V0$"],
                  },
                },
              ],
            },
          ],
        },
      },
    ],

    // Text/Dialogue Events
    [
      "src/lib/events/eventTextDialogue.js",
      {
        input: {
          text: "Hello World",
        },
        exportSuffix: "single",
        expectedScriptMatches: [matchIncludes("Hello World")],
      },
    ],
    [
      "src/lib/events/eventTextDialogue.js",
      {
        input: {
          text: ["Hello World", "Goodbye World"],
        },
        exportSuffix: "multi",
        expectedScriptMatches: [
          matchIncludes("Hello World"),
          matchIncludes("Goodbye World"),
        ],
      },
    ],

    // Comment Event
    [
      "src/lib/events/eventComment.js",
      {
        input: {
          text: "This is a comment",
        },
      },
    ],

    // Script Control Events
    [
      "src/lib/events/eventScriptStop.js",
      {
        input: {},
      },
    ],

    // Fade Events
    [
      "src/lib/events/eventFadeIn.js",
      {
        input: {
          speed: 2,
        },
      },
    ],
    [
      "src/lib/events/eventFadeOut.js",
      {
        input: {
          speed: 2,
        },
      },
    ],

    // Sprite Events
    [
      "src/lib/events/eventSpritesShow.js",
      {
        input: {},
      },
    ],
    [
      "src/lib/events/eventSpritesHide.js",
      {
        input: {},
      },
    ],

    // Overlay Events
    [
      "src/lib/events/eventOverlayHide.js",
      {
        input: {},
      },
    ],

    // Music Events
    [
      "src/lib/events/eventMusicStop.js",
      {
        input: {},
      },
    ],

    // Loop Events
    [
      "src/lib/events/eventLoop.js",
      {
        input: {
          true: [
            {
              id: "event1",
              command: "EVENT_TEXT",
              args: { text: "In Loop" },
            },
          ],
        },
      },
    ],

    // If Events
    [
      "src/lib/events/eventIf.js",
      {
        input: {
          condition: {
            type: "eq",
            valueA: { type: "variable", value: "L0" },
            valueB: { type: "number", value: 42 },
          },
          true: [
            {
              id: "event1",
              command: "EVENT_TEXT",
              args: { text: "True Path" },
            },
          ],
          false: [
            {
              id: "event2",
              command: "EVENT_TEXT",
              args: { text: "False Path" },
            },
          ],
        },
        expectedScriptMatches: [
          matchIncludes("True Path"),
          matchIncludes("False Path"),
        ],
      },
    ],

    [
      "src/lib/events/eventIf.js",
      {
        input: {
          condition: {
            type: "eq",
            valueA: { type: "variable", value: "L0" },
            valueB: { type: "number", value: 42 },
          },
          true: mockTruePath,
          false: mockFalsePath,
        },
        exportSuffix: "branch_functions",
        expectedMockCalls: [
          [mockTruePath, 2],
          [mockFalsePath, 2],
        ],
      },
    ],

    [
      "src/lib/events/eventIf.js",
      {
        input: {
          condition: { type: "true" },
          true: [
            {
              id: "event1",
              command: "EVENT_TEXT",
              args: { text: "True Path" },
            },
          ],
          false: [
            {
              id: "event2",
              command: "EVENT_TEXT",
              args: { text: "False Path" },
            },
          ],
        },
        exportSuffix: "fixed_value",
        expectedScriptMatches: [
          matchIncludes("True Path"),
          matchIncludes("False Path"),
        ],
      },
    ],

    // Link Cable Events
    [
      "src/lib/events/eventLinkStart.js",
      {
        input: {},
      },
    ],
    [
      "src/lib/events/eventLinkClose.js",
      {
        input: {},
      },
    ],
    [
      "src/lib/events/eventActorActivate.js",
      {
        input: {
          actorId: "player",
        },
      },
    ],
  ] as const;

  const exportCounter: Map<string, number> = new Map();

  const getExportName = (filename: string, suffix?: string): string => {
    const baseFilename =
      basename(filename, ".js") + (suffix ? `_${suffix}` : "");
    const currentCount = exportCounter.get(baseFilename) || 0;
    exportCounter.set(baseFilename, currentCount + 1);
    if (currentCount === 0) {
      return `${baseFilename}.s`;
    }
    return `${baseFilename}_${currentCount}.s`;
  };

  const filteredInput = input.some(([, data]) => "only" in data && data.only)
    ? input.filter(([, data]) => "only" in data && data.only)
    : input;

  test.each(filteredInput)(
    "Compare output for %s",
    async (filename, data) => {
      const qOutput: string[] = [];
      const eOutput: string[] = [];

      const pluginCode = await readFile(filename, "utf-8");

      const options =
        "options" in data && typeof data.options === "object"
          ? data.options
          : {};

      const testPostUpdate =
        "testPostUpdate" in data && Array.isArray(data.testPostUpdate)
          ? data.testPostUpdate
          : undefined;

      const expectedScriptMatches =
        "expectedScriptMatches" in data
          ? data.expectedScriptMatches
          : undefined;

      const expectedMockCalls =
        "expectedMockCalls" in data ? data.expectedMockCalls : undefined;

      const exportSuffix =
        "exportSuffix" in data ? data.exportSuffix : undefined;

      const exportAs = getExportName(filename, exportSuffix);

      const defaultScene = {
        id: "scene1",
        name: "Scene 1",
        symbol: "scene_1",
        width: 20,
        height: 18,
        background: dummyPrecompiledBackground,
        playerSprite: dummyPrecompiledSpriteSheet,
        sprites: [],
        parallax: [],
        actorsExclusiveLookup: {},
        type: "TOPDOWN",
        actors: [],
        triggers: [],
        projectiles: [],
      } as unknown as PrecompiledScene;

      const defaultOptions: Partial<ScriptBuilderOptions> = {
        scriptEventHandlers,
        scene: defaultScene,
        fonts: [dummyFontResource] as unknown as PrecompiledFontData[],
        compileEvents: (
          scriptBuilder: ScriptBuilder,
          childInput: ScriptEvent[],
        ) => {
          compileEventsWithScriptBuilder(
            scriptBuilder,
            childInput,
            {
              scriptType: "scene",
              scene: "scene1",
            },
            console.log,
          );
        },
        ...options,
      };

      const qSb = new ScriptBuilder(
        qOutput,
        defaultOptions as ScriptBuilderOptions,
      );

      const eSb = new ScriptBuilder(
        eOutput,
        defaultOptions as ScriptBuilderOptions,
      );

      const qPlugin = await loadScriptEventHandlerFromUntrustedString(
        pluginCode,
        filename,
      );
      const ePlugin = await loadScriptEventHandlerFromTrustedString(
        pluginCode,
        filename,
      );

      try {
        qPlugin.compile(data.input, { ...qSb });
        ePlugin.compile(data.input, { ...eSb });

        const qLabel = qPlugin.autoLabel?.(
          (key) => `LOOKUP_${key}`,
          data.input,
        );
        const eLabel = ePlugin.autoLabel?.(
          (key) => `LOOKUP_${key}`,
          data.input,
        );

        const qScriptString = qSb.toScriptString("script", true);
        const eScriptString = eSb.toScriptString("script", true);

        if (testPostUpdate) {
          for (const test of testPostUpdate) {
            const qUpdatedArgs = qPlugin.fieldsLookup[test.key].postUpdateFn?.(
              test.newArgs,
              test.prevArgs,
            );
            const eUpdatedArgs = ePlugin.fieldsLookup[test.key].postUpdateFn?.(
              test.newArgs,
              test.prevArgs,
            );
            expect(qUpdatedArgs).toEqual(test.expected);
            expect(qUpdatedArgs).toEqual(eUpdatedArgs);
          }
        }

        expect(qScriptString).toBe(eScriptString);

        if (expectedScriptMatches) {
          for (const expectedScriptMatch of expectedScriptMatches) {
            expect(qScriptString).toMatch(expectedScriptMatch);
          }
        }

        if (expectedMockCalls) {
          for (const [mockFn, expectedCallCount] of expectedMockCalls) {
            expect(mockFn).toHaveBeenCalledTimes(expectedCallCount);
          }
        }

        expect(qLabel).toBe(eLabel);

        await writeFile(join(__dirname, "_tmp", exportAs), qScriptString);

        expect(stripCommentsFromGBVMScript(qScriptString)).toMatchSnapshot();
      } finally {
        qPlugin.cleanup();
        ePlugin.cleanup();
      }
    },
    30000,
  );
});
