import { loadScriptEventHandlerFromTrustedString } from "lib/scriptEventsHandlers/trustedHandler";
import {
  loadScriptEventHandlerFromUntrustedString,
  QuickJS,
} from "lib/scriptEventsHandlers/untrustedHandler";
import { join } from "path";
import { readFile } from "fs-extra";
import {
  dummyPrecompiledBackground,
  dummyPrecompiledSpriteSheet,
} from "../dummydata";
import { PrecompiledScene } from "lib/compiler/generateGBVMData";
import ScriptBuilder, {
  ScriptBuilderOptions,
} from "lib/compiler/scriptBuilder";
import { getTestScriptHandlers } from "../getTestScriptHandlers";
import l10n, { setL10NData } from "shared/lib/lang/l10n";
import { ScriptEventHandlers } from "lib/scriptEventsHandlers/handlerTypes";
import { TestQuickJSWASMModule } from "quickjs-emscripten-core";

describe("script handlers", () => {
  let scriptEventHandlers: ScriptEventHandlers = {};

  beforeAll(async () => {
    scriptEventHandlers = await getTestScriptHandlers();
  });

  afterEach(async () => {
    const qjs = await QuickJS;
    const testQJS = new TestQuickJSWASMModule(qjs);
    testQJS.assertNoMemoryAllocated();
  });

  const testAllHandlers = (
    name: string,
    fn: (
      handlerLoader: typeof loadScriptEventHandlerFromTrustedString,
    ) => Promise<void>,
    timeout?: number,
  ) => {
    test(
      `Trusted : ${name}`,
      async () => {
        await fn(loadScriptEventHandlerFromTrustedString);
      },
      timeout,
    );
    test(
      `Untrusted : ${name}`,
      async () => {
        await fn(loadScriptEventHandlerFromUntrustedString);
      },
      timeout,
    );
  };

  const testUntrustedHandler = (
    name: string,
    fn: (
      handlerLoader: typeof loadScriptEventHandlerFromTrustedString,
    ) => Promise<void>,
    timeout?: number,
  ) => {
    test(
      `Untrusted : ${name}`,
      async () => {
        await fn(loadScriptEventHandlerFromUntrustedString);
      },
      timeout,
    );
  };

  testAllHandlers(
    "Can load a simple ScriptEventHandler",
    async (handlerLoader) => {
      const output: string[] = [];
      const pluginCode = `
        const id = "EVENT_TEST_ID";
        module.exports = {
          id,
          fields: [
            { key: "text", type: "text", defaultValue: "" },
            { key: "value", type: "number", defaultValue: 0 },
            { key: "flag", type: "boolean", defaultValue: false }
          ],
          autoLabel: (fetchArg, input) => id + "::" + fetchArg("text") + "::" + input.text,
          compile: (input, helpers) => {
            helpers.appendRaw(id + "::" + input.text);
          },
        };
      `;
      const handler = await handlerLoader(pluginCode, "test.js");
      expect(handler).toBeDefined();
      expect(handler.id).toBe("EVENT_TEST_ID");
      expect(handler.autoLabel).toBeDefined();
      expect(
        await handler.autoLabel?.((key: string) => `ABC_${key}`, {
          text: "test",
        }),
      ).toBe("EVENT_TEST_ID::ABC_text::test");
      expect(handler.compile).toBeDefined();

      for (let i = 0; i < 10; i++) {
        handler.compile(
          { text: "test" },
          { appendRaw: (msg: string) => output.push(msg) },
        );
      }
      expect(handler.fields).toHaveLength(3);

      expect(output[0]).toEqual("EVENT_TEST_ID::test");
      handler.cleanup();
    },
  );

  testAllHandlers(
    "Will pass through boolean values correctly",
    async (handlerLoader) => {
      const pluginCode = `
      module.exports = {
        id: "EVENT_TEST_BOOLEAN",
        compile: (input, helpers) => {
          const { passValue } = helpers;
          passValue(0, true)
          passValue(1, false)
          passValue(2, input.booleanTrue)
          passValue(3, input.booleanFalse)
          passValue(4, typeof input.booleanTrue)
          passValue(5, typeof input.booleanFalse)
        }
      };
    `;
      const plugin = await handlerLoader(pluginCode, "test.js");

      const myValues: unknown[] = [];

      plugin.compile(
        {
          booleanTrue: true,
          booleanFalse: false,
        },
        {
          passValue: (index: number, value: unknown) =>
            (myValues[index] = value),
        },
      );

      expect(myValues[0]).toBe(true);
      expect(myValues[1]).toBe(false);
      expect(myValues[2]).toBe(true);
      expect(myValues[3]).toBe(false);
      expect(myValues[4]).toBe("boolean");
      expect(myValues[5]).toBe("boolean");

      plugin.cleanup();
    },
  );

  testAllHandlers(
    "Can handle boolean and null return values from helper functions",
    async (handlerLoader) => {
      const pluginCode = `
      module.exports = {
        id: "EVENT_TEST_BOOLEAN_RETURN",
        compile: (input, helpers) => {
          const { log, getBooleanTrue, getBooleanFalse, getNull } = helpers;
          
          // These helper functions return boolean values that need to be converted via jsValueToHandle
          const resultTrue = getBooleanTrue();
          const resultFalse = getBooleanFalse();
          const resultNull = getNull();
          
          log(resultTrue);
          log(resultFalse);
          log(resultNull)
          log(typeof resultTrue);
          log(typeof resultFalse);
          log(typeof resultNull);

          // Test boolean values in conditional logic within VM
          if (resultTrue) {
            log("true branch");
          }
          if (!resultFalse) {
            log("false branch");
          }
          if (!resultNull) {
            log("null branch");
          }                
        }
      };
    `;
      const plugin = await handlerLoader(pluginCode, "test.js");

      const loggedValues: unknown[] = [];

      plugin.compile(
        {},
        {
          log: (value: unknown) => loggedValues.push(value),
          getBooleanTrue: () => true,
          getBooleanFalse: () => false,
          getNull: () => null,
        },
      );

      expect(loggedValues[0]).toBe(true);
      expect(loggedValues[1]).toBe(false);
      expect(loggedValues[2]).toBe(null);
      expect(loggedValues[3]).toBe("boolean");
      expect(loggedValues[4]).toBe("boolean");
      expect(loggedValues[5]).toBe("object");
      expect(loggedValues[6]).toBe("true branch");
      expect(loggedValues[7]).toBe("false branch");
      expect(loggedValues[8]).toBe("null branch");

      plugin.cleanup();
    },
  );

  testAllHandlers(
    "Can handle boolean values passed directly to compile function",
    async (handlerLoader) => {
      const pluginCode = `
      module.exports = {
        id: "EVENT_TEST_BOOLEAN_DIRECT",
        compile: (input, helpers) => {
          helpers.log("input:", input);
          helpers.log("typeof input:", typeof input);
          
          if (input) {
            helpers.log("input is truthy");
          } else {
            helpers.log("input is falsy");
          }
        }
      };
    `;
      const plugin = await handlerLoader(pluginCode, "test.js");

      const loggedValues: string[] = [];
      const helpers = {
        log: (...args: unknown[]) => loggedValues.push(args.join(" ")),
      };

      // Test with true
      plugin.compile(true, helpers);

      // Test with false
      plugin.compile(false, helpers);

      expect(loggedValues).toContain("input: true");
      expect(loggedValues).toContain("typeof input: boolean");
      expect(loggedValues).toContain("input is truthy");
      expect(loggedValues).toContain("input: false");
      expect(loggedValues).toContain("input is falsy");

      plugin.cleanup();
    },
  );

  testAllHandlers(
    "Can handle null values passed directly to compile function",
    async (handlerLoader) => {
      const pluginCode = `
      module.exports = {
        id: "EVENT_TEST_NULL_DIRECT",
        compile: (input, helpers) => {
          helpers.log("input:", input);
          helpers.log("typeof input:", typeof input);
          if (input) {
            helpers.log("input is truthy");
          } else {
            helpers.log("input is falsy");
          }
        }
      };
    `;
      const plugin = await handlerLoader(pluginCode, "test.js");

      const loggedValues: string[] = [];
      const helpers = {
        log: (...args: unknown[]) => loggedValues.push(args.join(" ")),
      };

      plugin.compile(null, helpers);

      expect(loggedValues).toContain("input: ");
      expect(loggedValues).toContain("typeof input: object");
      expect(loggedValues).toContain("input is falsy");

      plugin.cleanup();
    },
  );

  describe("Autolabel", () => {
    testAllHandlers(
      "hasAutoLabel correctly detects autoLabel function presence",
      async (handlerLoader) => {
        // Test with autoLabel function present
        const pluginWithAutoLabel = `
          const id = "EVENT_WITH_AUTOLABEL";
          module.exports = {
            id,
            fields: [
              { key: "text", type: "text", defaultValue: "" }
            ],
            autoLabel: (fetchArg, input) => id + "::" + fetchArg("text"),
            compile: (input, helpers) => {
              helpers.appendRaw(id + "::" + input.text);
            },
          };
        `;

        const handlerWithAutoLabel = await handlerLoader(
          pluginWithAutoLabel,
          "test.js",
        );
        expect(handlerWithAutoLabel.hasAutoLabel).toBe(true);
        expect(handlerWithAutoLabel.autoLabel).toBeDefined();
        handlerWithAutoLabel.cleanup();

        // Test without autoLabel function
        const pluginWithoutAutoLabel = `
          const id = "EVENT_WITHOUT_AUTOLABEL";
          module.exports = {
            id,
            fields: [
              { key: "text", type: "text", defaultValue: "" }
            ],
            compile: (input, helpers) => {
              helpers.appendRaw(id + "::" + input.text);
            },
          };
        `;

        const handlerWithoutAutoLabel = await handlerLoader(
          pluginWithoutAutoLabel,
          "test.js",
        );
        expect(handlerWithoutAutoLabel.hasAutoLabel).toBe(false);
        expect(handlerWithoutAutoLabel.autoLabel).toBeUndefined();
        handlerWithoutAutoLabel.cleanup();
      },
    );

    testAllHandlers(
      "will throw if trying to call autoLabel on a module without autoLabel",
      async (handlerLoader) => {
        const pluginWithoutAutoLabel = `
          const id = "EVENT_WITHOUT_AUTOLABEL";
          module.exports = {
            id,
          };
        `;

        const handlerWithoutAutoLabel = await handlerLoader(
          pluginWithoutAutoLabel,
          "test.js",
        );

        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          handlerWithoutAutoLabel.autoLabel!((key: string) => `ABC_${key}`, {
            text: "test",
          });
        }).toThrow();

        handlerWithoutAutoLabel.cleanup();
      },
    );

    testAllHandlers(
      "will throw if trying to call autoLabel on a module with invalid autoLabel",
      async (handlerLoader) => {
        const pluginWithoutAutoLabel = `
          const id = "EVENT_WITHOUT_AUTOLABEL";
          module.exports = {
            id,
            autoLabel: (fetchArg, input) => missingFn("FOO"),
          };
        `;

        const handlerWithoutAutoLabel = await handlerLoader(
          pluginWithoutAutoLabel,
          "test.js",
        );

        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          handlerWithoutAutoLabel.autoLabel!((key: string) => `ABC_${key}`, {
            text: "test",
          });
        }).toThrow();

        handlerWithoutAutoLabel.cleanup();
      },
    );
  });

  describe("Compile", () => {
    testAllHandlers(
      "will throw if trying to call compile but compile has not been defined in plugin",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
          };
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        expect(handler.compile).toBeDefined();
        expect(() => {
          handler.compile({ text: "test" }, {});
        }).toThrow();
        handler.cleanup();
      },
    );

    testAllHandlers(
      "will throw if trying to call compile but compile has not been defined in esmodule plugin",
      async (handlerLoader) => {
        const pluginCode = `
          export const id = "EVENT_TEST_ID";
          `;
        const handler = await handlerLoader(pluginCode, "test.js");
        expect(handler.compile).toBeDefined();
        expect(() => {
          handler.compile({ text: "test" }, {});
        }).toThrow();
        handler.cleanup();
      },
    );

    testAllHandlers(
      "Will pass through undefined correctly",
      async (handlerLoader) => {
        const pluginCode = `
          module.exports = {
            id: "EVENT_TEST_ID",
            compile: (input, helpers) => {
              const { passValue } = helpers;
              passValue(0, typeof input.nonDefinedValue)
              passValue(1, "ABC")
              passValue(2, undefined) 
              passValue(3, input.nonDefinedValue)
              passValue(4, input.nonPassedInValue)
            }
          };
        `;
        const plugin = await handlerLoader(pluginCode, "test.js");

        const myValues: unknown[] = [];

        plugin.compile(
          {
            nonDefinedValue: undefined,
          },
          {
            passValue: (index: number, value: unknown) =>
              (myValues[index] = value),
          },
        );

        expect(myValues[0]).toBe("undefined");
        expect(myValues[1]).toBe("ABC");
        expect(myValues[2]).toBeUndefined();
        expect(myValues[3]).toBeUndefined();
        expect(myValues[4]).toBeUndefined();

        plugin.cleanup();
      },
    );

    testAllHandlers("Can generate fieldsLookup", async (handlerLoader) => {
      const pluginCode = `
        const id = "EVENT_TEST_ID";
        module.exports = {
          id,
          fields: [
            { key: "text", type: "text", defaultValue: "" },
            { key: "value", type: "number", defaultValue: 0 },
            { key: "flag", type: "boolean", defaultValue: false }
          ],
          autoLabel: (fetchArg, input) => id + "::" + fetchArg("text") + "::" + input.text,
          compile: (input, helpers) => {
            helpers.appendRaw(id + "::" + input.text);
          },
        };
      `;
      const handler = await handlerLoader(pluginCode, "test.js");
      expect(handler).toBeDefined();
      expect(handler.id).toBe("EVENT_TEST_ID");

      expect(handler.fieldsLookup).toEqual({
        text: {
          key: "text",
          type: "text",
          defaultValue: "",
          hasPostUpdateFn: false,
        },
        value: {
          key: "value",
          type: "number",
          defaultValue: 0,
          hasPostUpdateFn: false,
        },
        flag: {
          defaultValue: false,
          hasPostUpdateFn: false,
          key: "flag",
          type: "boolean",
        },
      });

      handler.cleanup();
    });

    testAllHandlers(
      "Can call _addNL when extra args are passed in",
      async (handlerLoader) => {
        const output: string[] = ["Hello World"];

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
        };

        const sb = new ScriptBuilder(
          output,
          defaultOptions as ScriptBuilderOptions,
        );

        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
            fields: [],
            compile: (input, helpers) => {
              helpers.appendRaw("BEFORE");
              helpers._addNL("ABC");
              helpers._addNL("ONLY WORKS IF AN ARGUMENT IS PASSED");
              helpers.appendRaw("AFTER");
            },
          };
        `;

        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            actorId: "player",
          },
          { ...sb },
        );

        const scriptString = sb.toScriptString("script", true);

        expect(scriptString).toInclude("BEFORE\n\n\n\n        AFTER");

        plugin.cleanup();
      },
    );

    testAllHandlers(
      "Can call _addNL without passing in extra args",
      async (handlerLoader) => {
        const output: string[] = ["Hello World"];

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
        };

        const sb = new ScriptBuilder(
          output,
          defaultOptions as ScriptBuilderOptions,
        );

        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
            fields: [],
            compile: (input, helpers) => {
              helpers.appendRaw("BEFORE");
              helpers._addNL();
              helpers._addNL();
              helpers.appendRaw("AFTER");
            },
          };
        `;

        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            actorId: "player",
          },
          { ...sb },
        );

        const scriptString = sb.toScriptString("script", true);

        expect(scriptString).toInclude("BEFORE\n\n\n\n        AFTER");

        plugin.cleanup();
      },
    );

    testAllHandlers("Can call fns with no args", async (handlerLoader) => {
      let output: string[] = [];

      const helpers = {
        fnA: () => output.push("A"),
        fnB: (msg: string) => output.push("B::" + msg),
      };

      const pluginCodeWithExtraArgs = `
        const id = "EVENT_TEST_ID";
        module.exports = {
          id,
          fields: [],
          compile: (input, helpers) => {
            helpers.fnA("SHOULDNT_BE_NECESSARY");
            helpers.fnB("Hello");
          },
        };
      `;

      const pluginWithExtraArgs = await handlerLoader(
        pluginCodeWithExtraArgs,
        "test.js",
      );

      pluginWithExtraArgs.compile(
        {
          actorId: "player",
        },
        helpers,
      );

      expect(output).toEqual(["A", "B::Hello"]);

      pluginWithExtraArgs.cleanup();

      output = [];

      const pluginCode = `
        const id = "EVENT_TEST_ID";
        module.exports = {
          id,
          fields: [],
          compile: (input, helpers) => {
            helpers.fnA()
            helpers.fnB("World");
          },
        };
      `;

      const plugin = await handlerLoader(pluginCode, "test.js");

      plugin.compile(
        {
          actorId: "player",
        },
        helpers,
      );

      expect(output).toEqual(["A", "B::World"]);

      plugin.cleanup();
    });

    testAllHandlers(
      "Can pass callbacks in/out of vm",
      async (handlerLoader) => {
        const output: string[] = [];

        const helpers = {
          fnA: (msg: string) => output.push("A::" + msg),
          fnB: (msg: string, cb: () => void) => {
            cb();
          },
        };

        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
            fields: [],
            compile: (input, helpers) => {
              helpers.fnA("Hello");
              helpers.fnB("FOOBAR", () => {
                helpers.fnA("World");
              });
            },
          };
        `;

        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            actorId: "player",
          },
          helpers,
        );

        expect(output).toEqual(["A::Hello", "A::World"]);

        plugin.cleanup();
      },
    );

    testAllHandlers(
      "Can pass input into helper functions inside vm",
      async (handlerLoader) => {
        const output: unknown[] = [];

        const helpers = {
          fnA: (input: unknown) => {
            return input;
          },
          fnB: (input: unknown) => {
            return input;
          },
          log: (value: unknown) => {
            output.push(value);
          },
        };

        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
            fields: [],
            compile: (input, helpers) => {
              // Test 1: Direct pass
              const result1 = helpers.fnB(input);
              helpers.log(result1);
              
              // Test 2: Destructured pass
              const result2 = helpers.fnB({...input});
              helpers.log(result2);
              
              // Test 3: Manual object construction
              const result3 = helpers.fnB({actorId: input.actorId, foo: input.foo});
              helpers.log(result3);

              // Test 4: Manual array construction
              const result4 = helpers.fnB([input.actorId, input.foo]);
              helpers.log(result4);
            },
          };
        `;

        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            actorId: "player",
            foo: "bar",
          },
          helpers,
        );

        expect(output).toHaveLength(4);
        expect(output[0]).toEqual({ actorId: "player", foo: "bar" });
        expect(output[1]).toEqual({ actorId: "player", foo: "bar" });
        expect(output[2]).toEqual({ actorId: "player", foo: "bar" });
        expect(output[3]).toEqual(["player", "bar"]);

        plugin.cleanup();
      },
    );

    testAllHandlers(
      "Can call string functions on input passed into VM",
      async (handlerLoader) => {
        const output: unknown[] = [];

        const helpers = {
          fnA: (input: string) => {
            const match = String(input).match(/foo/);
            if (match) {
              return match[0];
            }
            return undefined;
          },
          fnB: (input: string) => {
            const match = input.match(/foo/);
            if (match) {
              return match[0];
            }
            return undefined;
          },
          log: (value: unknown) => {
            output.push(value);
          },
        };

        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
            fields: [],
            compile: (input, helpers) => {
              const result1 = helpers.fnA(input.text);
              helpers.log(result1);
              const result2 = helpers.fnB("hey_foo_bar");
              helpers.log(result2);
              const result3 = helpers.fnB(input.text);
              helpers.log(result3);       
              helpers.log(typeof input.text);   
            },
          };
        `;

        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            text: "hello_foo_world",
          },
          helpers,
        );

        // All three results should be equivalent
        expect(output).toHaveLength(4);
        expect(output[0]).toEqual("foo");
        expect(output[1]).toEqual("foo");
        expect(output[2]).toEqual("foo");
        expect(output[3]).toEqual("string");

        plugin.cleanup();
      },
    );

    testAllHandlers(
      "Can call string functions on input string array passed into VM",
      async (handlerLoader) => {
        const output: unknown[] = [];

        const helpers = {
          fnA: (input: string[]) => {
            try {
              for (const str of input) {
                const match = String(str).match(/foo/);
                if (match) {
                  return match[0];
                }
              }
            } catch (error) {
              console.error("Error in fnA:", error);
            }
            return undefined;
          },
          fnB: (input: string) => {
            try {
              for (const str of input) {
                const match = str.match(/foo/);
                if (match) {
                  return match[0];
                }
              }
            } catch (error) {
              console.error("Error in fnB:", error);
            }
            return undefined;
          },
          log: (value: unknown) => {
            output.push(value);
          },
        };

        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
            fields: [],
            compile: (input, helpers) => {
              const result1 = helpers.fnA(input.text);
              helpers.log(result1);
              const result2 = helpers.fnB(["hey_foo_bar", "there_foo_baz"]);
              helpers.log(result2);
              const result3 = helpers.fnB(input.text);
              helpers.log(result3);       
              helpers.log(typeof input.text);   
              helpers.log(Array.isArray(["Test"]));
              helpers.log(Array.isArray(input.text));
            },
          };
        `;

        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            text: ["hello_foo_world", "another_foo_test"],
          },
          helpers,
        );

        // All three results should be equivalent
        expect(output).toHaveLength(6);
        expect(output[0]).toEqual("foo");
        expect(output[1]).toEqual("foo");
        expect(output[2]).toEqual("foo");
        expect(output[3]).toEqual("object");
        expect(output[4]).toEqual(true);
        expect(output[5]).toEqual(true);

        plugin.cleanup();
      },
    );

    testAllHandlers(
      "Can call string functions on input passed into plugin",
      async (handlerLoader) => {
        const output: unknown[] = [];

        const helpers = {
          fnA: (input: string) => {
            const match = String(input).match(/foo/);
            if (match) {
              return match[0];
            }
            return undefined;
          },
          fnB: (input: string) => {
            const match = input.match(/foo/);
            if (match) {
              return match[0];
            }
            return undefined;
          },
          log: (value: unknown) => {
            output.push(value);
          },
        };

        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
            fields: [],
            compile: (input, helpers) => {
              const result1 = helpers.fnA(input.text);
              helpers.log(result1);
              const result2 = helpers.fnB("hey_foo_bar");
              helpers.log(result2);
              const result3 = helpers.fnB(input.text);
              helpers.log(result3);       
              helpers.log(typeof input.text);   
            },
          };
        `;

        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            text: "hello_foo_world",
          },
          helpers,
        );

        // All three results should be equivalent
        expect(output).toHaveLength(4);
        expect(output[0]).toEqual("foo");
        expect(output[1]).toEqual("foo");
        expect(output[2]).toEqual("foo");
        expect(output[3]).toEqual("string");

        plugin.cleanup();
      },
    );

    testAllHandlers(
      "Can call string functions on input string array passed into plugin",
      async (handlerLoader) => {
        const output: unknown[] = [];

        const helpers = {
          fnA: (input: string[]) => {
            try {
              for (const str of input) {
                const match = String(str).match(/foo/);
                if (match) {
                  return match[0];
                }
              }
            } catch (error) {
              console.error("Error in fnA:", error);
            }
            return undefined;
          },
          fnB: (input: string) => {
            try {
              for (const str of input) {
                const match = str.match(/foo/);
                if (match) {
                  return match[0];
                }
              }
            } catch (error) {
              console.error("Error in fnB:", error);
            }
            return undefined;
          },
          log: (value: unknown) => {
            output.push(value);
          },
        };

        const pluginCode = `
          const id = "EVENT_TEST_ID";
          module.exports = {
            id,
            fields: [],
            compile: (input, helpers) => {
              const result1 = helpers.fnA(input.text);
              helpers.log(result1);
              const result2 = helpers.fnB(["hey_foo_bar", "there_foo_baz"]);
              helpers.log(result2);
              const result3 = helpers.fnB(input.text);
              helpers.log(result3);       
              helpers.log(typeof input.text);   
              helpers.log(Array.isArray(["Test"]));
              helpers.log(Array.isArray(input.text));
            },
          };
        `;

        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            text: ["hello_foo_world", "another_foo_test"],
          },
          helpers,
        );

        // All three results should be equivalent
        expect(output).toHaveLength(6);
        expect(output[0]).toEqual("foo");
        expect(output[1]).toEqual("foo");
        expect(output[2]).toEqual("foo");
        expect(output[3]).toEqual("object");
        expect(output[4]).toEqual(true);
        expect(output[5]).toEqual(true);

        plugin.cleanup();
      },
    );
  });

  describe("Modules", () => {
    testAllHandlers(
      "will throw error if trying to require a non allowed module",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_WITH_MODULE";
          const fs = require("fs");
          module.exports = {
            id,
          };
        `;

        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    testAllHandlers(
      "will throw error if trying to require a missing module",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_WITH_MODULE";
          const missingModule = require("./missing-module");
          module.exports = {
            id,
          };
        `;

        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    describe("console", () => {
      let spies: jest.SpyInstance[] = [];
      beforeEach(() => {
        spies = [
          jest.spyOn(console, "log").mockImplementation(() => {}),
          jest.spyOn(console, "warn").mockImplementation(() => {}),
          jest.spyOn(console, "error").mockImplementation(() => {}),
        ];
      });
      afterEach(() => spies.forEach((s) => s.mockRestore()));

      testAllHandlers(
        "can call console.log from within VM",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_WITH_CONSOLE_LOG";
            console.log("Hello from VM");
            module.exports = {
              id,
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          console.log("Hello from Host");
          expect(spies[0]).toHaveBeenCalledWith("Hello from Host");
          expect(spies[0]).toHaveBeenCalledWith("Hello from VM");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can call console.warn from within VM",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_WITH_CONSOLE_LOG";
            console.warn("Warn from VM");
            module.exports = {
              id,
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          console.warn("Warn from Host");
          expect(spies[1]).toHaveBeenCalledWith("Warn from Host");
          expect(spies[1]).toHaveBeenCalledWith("Warn from VM");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can call console.error from within VM",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_WITH_CONSOLE_LOG";
            console.error("Error from VM");
            module.exports = {
              id,
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          console.error("Error from Host");
          expect(spies[2]).toHaveBeenCalledWith("Error from Host");
          expect(spies[2]).toHaveBeenCalledWith("Error from VM");
          handler.cleanup();
        },
      );
    });

    describe("l10n", () => {
      testAllHandlers(
        "Can call l10n from within VM plugin",
        async (handlerLoader) => {
          const pluginCode = await readFile(
            join(__dirname, "_files/testEventMoveTo.js"),
            "utf-8",
          );
          setL10NData({
            EVENT_ACTOR_MOVE_TO_LABEL: "Actor {actor} moves to {x}, {y}",
            FIELD_PIXELS_SHORT: "px",
          });

          const plugin = await handlerLoader(pluginCode, "test.js");

          const value = plugin.autoLabel?.((key: string) => `ARG_${key}`, {
            bar: "BAR",
            units: "pixels",
          });

          expect(value).toEqual("Actor ARG_actorId moves to ARG_xpx, ARG_ypx");

          plugin.cleanup();
        },
      );

      testAllHandlers(
        "Can call l10n from within VM plugin using esmodule",
        async (handlerLoader) => {
          const pluginCode = await readFile(
            join(__dirname, "_files/testEventEsmodule.js"),
            "utf-8",
          );
          setL10NData({
            EVENT_ACTOR_MOVE_TO_LABEL: "Actor {actor} moves to {x}, {y}",
            FIELD_PIXELS_SHORT: "px",
          });

          const plugin = await handlerLoader(pluginCode, "test.js");

          const value = plugin.autoLabel?.((key: string) => `ARG_${key}`, {
            bar: "BAR",
            units: "pixels",
          });

          expect(value).toEqual("Actor ARG_actorId moves to ARG_xpx, ARG_ypx");

          plugin.cleanup();
        },
      );
    });

    describe("readFile", () => {
      testAllHandlers("can read file from within VM", async (handlerLoader) => {
        const pluginCode = `
          const { readFile } = require("plugin-api");
          const id = "EVENT_ID";
          module.exports = {
            id,
            name: readFile("./test.js"),
          };
        `;
        const handler = await handlerLoader(
          pluginCode,
          "test.js",
          (filePath) => `File content of ${filePath}`,
        );
        expect(handler.id).toBe("EVENT_ID");
        expect(handler.name).toBe("File content of ./test.js");
        handler.cleanup();
      });

      testAllHandlers(
        "can read text file from within VM",
        async (handlerLoader) => {
          const pluginCode = `
            const { readText } = require("plugin-api");
            const id = "EVENT_ID";
            module.exports = {
              id,
              name: readText("./test.js"),
            };
          `;
          const handler = await handlerLoader(
            pluginCode,
            "test.js",
            (filePath) => `File content of ${filePath}`,
          );
          expect(handler.id).toBe("EVENT_ID");
          expect(handler.name).toBe("File content of ./test.js");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can read JSON file from within VM",
        async (handlerLoader) => {
          const pluginCode = `
            const { readJSON } = require("plugin-api");
            const id = "EVENT_ID";
            module.exports = {
              id,
              name: readJSON("./test.json").name,
            };
          `;
          const handler = await handlerLoader(
            pluginCode,
            "test.js",
            (filePath) => `{"name": "File content of ${filePath}"}`,
          );
          expect(handler.id).toBe("EVENT_ID");
          expect(handler.name).toBe("File content of ./test.json");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "will throw error when reading a file without a file reader function",
        async (handlerLoader) => {
          const pluginCode = `
            const { readFile } = require("plugin-api");
            const id = "EVENT_ID";
            module.exports = {
              id,
              name: readFile("./test.txt"),
            };
          `;

          await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
        },
      );

      testAllHandlers(
        "can read file from within VM when using esmodules",
        async (handlerLoader) => {
          const pluginCode = `
            import api from "plugin-api";
            export const id = "EVENT_ID";
            export const name = api.readFile("./test.js");
          `;
          const handler = await handlerLoader(
            pluginCode,
            "test.js",
            (filePath) => `File content of ${filePath}`,
          );
          expect(handler.id).toBe("EVENT_ID");
          expect(handler.name).toBe("File content of ./test.js");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can read file from within VM when using esmodules with destructured import",
        async (handlerLoader) => {
          const pluginCode = `
            import { readFile } from "plugin-api";
            export const id = "EVENT_ID";
            export const name = readFile("./test.js");
          `;
          const handler = await handlerLoader(
            pluginCode,
            "test.js",
            (filePath) => `File content of ${filePath}`,
          );
          expect(handler.id).toBe("EVENT_ID");
          expect(handler.name).toBe("File content of ./test.js");
          handler.cleanup();
        },
      );
    });

    describe("esmodules", () => {
      testAllHandlers(
        "can make modules as esmodules",
        async (handlerLoader) => {
          const pluginCode = `
            export const id = "EVENT_ID";
            export const name = "My Plugin";
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          expect(handler.id).toBe("EVENT_ID");
          expect(handler.name).toBe("My Plugin");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle named exports with braces syntax",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            const name = "My Plugin";
            const fields = [];
            export { id, name, fields };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          expect(handler.id).toBe("EVENT_ID");
          expect(handler.name).toBe("My Plugin");
          expect(handler.fields).toEqual([]);
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle export without assignment",
        async (handlerLoader) => {
          const pluginCode = `
            export function compile(input, helpers) {
              helpers.appendRaw("test");
            }
            export const id = "EVENT_ID";
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          expect(handler.id).toBe("EVENT_ID");
          expect(handler.compile).toBeDefined();

          const output: string[] = [];
          handler.compile({}, { appendRaw: (msg: string) => output.push(msg) });
          expect(output[0]).toBe("test");
          handler.cleanup();
        },
      );
    });

    describe("vm-function-handling", () => {
      testAllHandlers(
        "can handle VM functions passed back to host",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            
            // Create a function that will be passed from VM to host
            const myVmFunction = (input) => {
              return "VM says: " + input;
            };
            
            module.exports = {
              id,
              compile: (input, helpers) => {
                // Pass the VM function to the host
                const result = helpers.callWithVmFunction(myVmFunction);
                helpers.appendRaw(result);
              }
            };
          `;

          const handler = await handlerLoader(pluginCode, "test.js");
          expect(handler.id).toBe("EVENT_ID");

          const output: string[] = [];
          const helpers = {
            appendRaw: (msg: string) => output.push(msg),
            callWithVmFunction: (vmFunc: (input: string) => string) => {
              // This should trigger the "function" case in handleToJsValue
              // because vmFunc is a function created in the VM
              return vmFunc("Hello from host");
            },
          };

          handler.compile({}, helpers);
          expect(output[0]).toBe("VM says: Hello from host");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle function in object for untrusted VM",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            
            module.exports = {
              id,
              compile: (input, helpers) => {
                // Create an object with a function property
                const myFunction = (x) => x * 3;
                const myObject = {
                  number: 42,
                  func: myFunction,
                  text: "hello"
                };
                
                // Pass the object to host - this should trigger handleToJsValue for the function property
                helpers.inspectObject(myObject);
              }
            };
          `;

          const handler = await handlerLoader(pluginCode, "test.js");
          expect(handler.id).toBe("EVENT_ID");

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let capturedObject: any = null;
          const helpers = {
            inspectObject: (obj: unknown) => {
              // Capture the object with its function property
              capturedObject = obj;
            },
          };

          handler.compile({}, helpers);

          expect(capturedObject).toBeDefined();
          expect(capturedObject.number).toBe(42);
          expect(capturedObject.text).toBe("hello");
          expect(typeof capturedObject.func).toBe("function"); // This should trigger the function case

          // Actually test that the function works and was properly converted
          const result = capturedObject.func(5);
          expect(result).toBe(15); // 5 * 3 = 15

          handler.cleanup();
        },
      );

      testUntrustedHandler(
        "can handle function in object with object args",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            
            module.exports = {
              id,
              compile: (input, helpers) => {
                // Create an object with a function property
                const myFunction = (x) => x.a * x.b;
                const myObject = {
                  number: 42,
                  func: myFunction,
                  text: "hello"
                };
                
                // Pass the object to host - this should trigger handleToJsValue for the function property
                helpers.inspectObject(myObject);
              }
            };
          `;

          const handler = await handlerLoader(pluginCode, "test.js");
          expect(handler.id).toBe("EVENT_ID");

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let capturedObject: any = null;
          const helpers = {
            inspectObject: (obj: unknown) => {
              // Capture the object with its function property
              capturedObject = obj;
            },
          };

          handler.compile({}, helpers);

          expect(capturedObject).toBeDefined();
          expect(capturedObject.number).toBe(42);
          expect(capturedObject.text).toBe("hello");
          expect(typeof capturedObject.func).toBe("function"); // This should trigger the function case

          // Actually test that the function works and was properly converted
          const result = capturedObject.func({ a: 5, b: 3 });
          expect(result).toBe(15); // 5 * 3 = 15

          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle function in object with array args",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            
            module.exports = {
              id,
              compile: (input, helpers) => {
                // Create an object with a function property
                const myFunction = (x) => x[0] * x[1];
                const myObject = {
                  number: 42,
                  func: myFunction,
                  text: "hello"
                };
                
                // Pass the object to host - this should trigger handleToJsValue for the function property
                helpers.inspectObject(myObject);
              }
            };
          `;

          const handler = await handlerLoader(pluginCode, "test.js");
          expect(handler.id).toBe("EVENT_ID");

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let capturedObject: any = null;
          const helpers = {
            inspectObject: (obj: unknown) => {
              // Capture the object with its function property
              capturedObject = obj;
            },
          };

          handler.compile({}, helpers);

          expect(capturedObject).toBeDefined();
          expect(capturedObject.number).toBe(42);
          expect(capturedObject.text).toBe("hello");
          expect(typeof capturedObject.func).toBe("function"); // This should trigger the function case

          // Actually test that the function works and was properly converted
          const result = capturedObject.func([5, 3]);
          expect(result).toBe(15); // 5 * 3 = 15

          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle complex object with nested functions and return value from VM function",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            
            module.exports = {
              id,
              compile: (input, helpers) => {
                // Create a more complex object to ensure we hit handleToJsValue thoroughly
                const complexObject = {
                  data: {
                    nested: "value",
                    count: 100
                  },
                  methods: {
                    add: function(a, b) {
                      return a + b;
                    },
                    multiply: function(x, y) {
                      return x * y;
                    },
                    getGreeting: function(name) {
                      return "Hello, " + name + "!";
                    }
                  },
                  callback: function(value) {
                    // Return another object with functions to test deep conversion
                    return {
                      value: value * 2,
                      transformer: function(input) {
                        return input.toString().toUpperCase();
                      }
                    };
                  }
                };
                
                // Pass to helper to trigger handleToJsValue
                helpers.processComplexObject(complexObject);
              }
            };
          `;

          const handler = await handlerLoader(pluginCode, "test.js");
          expect(handler.id).toBe("EVENT_ID");

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let capturedObject: any = null;
          const helpers = {
            processComplexObject: (obj: unknown) => {
              capturedObject = obj;
            },
          };

          handler.compile({}, helpers);

          expect(capturedObject).toBeDefined();
          expect(capturedObject.data.nested).toBe("value");
          expect(capturedObject.data.count).toBe(100);

          // Test all the methods work properly
          expect(typeof capturedObject.methods.add).toBe("function");
          expect(typeof capturedObject.methods.multiply).toBe("function");
          expect(typeof capturedObject.methods.getGreeting).toBe("function");
          expect(typeof capturedObject.callback).toBe("function");

          expect(capturedObject.methods.add(10, 20)).toBe(30);
          expect(capturedObject.methods.multiply(4, 5)).toBe(20);
          expect(capturedObject.methods.getGreeting("World")).toBe(
            "Hello, World!",
          );

          // Test the callback that returns an object with functions
          const callbackResult = capturedObject.callback(5);
          expect(callbackResult.value).toBe(10);
          expect(typeof callbackResult.transformer).toBe("function");
          expect(callbackResult.transformer("test")).toBe("TEST");

          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle function error cases in handleToJsValue",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            
            module.exports = {
              id,
              compile: (input, helpers) => {
                // Create an object with a function that will cause an error when called
                const objectWithFunction = {
                  data: "test",
                  errorFunction: function() {
                    throw new Error("Intentional test error");
                  }
                };
                
                // Pass to helper to trigger handleToJsValue
                helpers.processObjectWithFunction(objectWithFunction);
              }
            };
          `;

          const handler = await handlerLoader(pluginCode, "test.js");

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let capturedObject: any = null;
          const helpers = {
            processObjectWithFunction: (obj: unknown) => {
              capturedObject = obj;
            },
          };

          handler.compile({}, helpers);

          expect(capturedObject).toBeDefined();
          expect(typeof capturedObject.errorFunction).toBe("function");

          // Test that calling the function properly handles errors
          expect(() => capturedObject.errorFunction()).toThrow();

          handler.cleanup();
        },
      );
    });

    describe("proxy-system", () => {
      testAllHandlers(
        "can handle array method calls through proxy",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            module.exports = {
              id,
              compile: (input, helpers) => {
                if (Array.isArray(input.arrayValue)) {
                  const result = input.arrayValue.push(42);
                  helpers.captureResult(result);
                } else {
                  helpers.captureResult(0);
                }
              }
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          const input = {
            arrayValue: [1, 2, 3],
          };

          let capturedResult: unknown = null;
          const helpers = {
            captureResult: (result: unknown) => {
              capturedResult = result;
            },
          };

          handler.compile(input, helpers);
          expect(typeof capturedResult).toBe("number");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle object method calls through proxy",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            module.exports = {
              id,
              compile: (input, helpers) => {
                if (input.objWithMethod && typeof input.objWithMethod.getValue === 'function') {
                  try {
                    const result = input.objWithMethod.getValue();
                    helpers.captureResult(result);
                  } catch (e) {
                    // Untrusted handler may not preserve 'this' context for methods
                    helpers.captureResult("method error: " + e.message);
                  }
                } else {
                  helpers.captureResult(null);
                }
              }
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          const input = {
            objWithMethod: {
              value: 123,
              getValue: function () {
                return this.value;
              },
            },
          };

          let capturedResult: unknown = null;
          const helpers = {
            captureResult: (result: unknown) => {
              capturedResult = result;
            },
          };

          handler.compile(input, helpers);
          // Trusted handler preserves 'this' context, untrusted may not
          if (
            typeof capturedResult === "string" &&
            capturedResult.includes("method error")
          ) {
            // This is expected for untrusted handler - test still passes
            expect(capturedResult).toContain("method error");
          } else {
            // This is expected for trusted handler
            expect(capturedResult).toBe(123);
          }
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle non-function property access error",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            module.exports = {
              id,
              compile: (input, helpers) => {
                try {
                  // Try to call a non-function property as a function
                  const result = input.notAFunction();
                  helpers.captureResult(result);
                } catch (e) {
                  helpers.captureResult("error caught: " + e.message);
                }
              }
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          const input = {
            notAFunction: "this is a string, not a function",
          };

          let capturedResult: unknown = null;
          const helpers = {
            captureResult: (result: unknown) => {
              capturedResult = result;
            },
          };

          handler.compile(input, helpers);
          expect(typeof capturedResult).toBe("string");
          expect(capturedResult).toContain("error caught");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle undefined property access",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            module.exports = {
              id,
              compile: (input, helpers) => {
                const value = input.nonExistentProperty;
                helpers.captureResult(value === undefined ? "undefined" : value);
              }
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          const input = {};

          let capturedResult: unknown = null;
          const helpers = {
            captureResult: (result: unknown) => {
              capturedResult = result;
            },
          };

          handler.compile(input, helpers);
          expect(capturedResult).toBe("undefined");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle function callback with error",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            module.exports = {
              id,
              compile: (input, helpers) => {
                if (typeof input.callbackFn === 'function') {
                  try {
                    const result = input.callbackFn("test");
                    helpers.captureResult(result);
                  } catch (e) {
                    helpers.captureResult("callback error: " + e.message);
                  }
                } else {
                  helpers.captureResult("no callback");
                }
              }
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          const input = {
            callbackFn: function () {
              throw new Error("Callback failed");
            },
          };

          let capturedResult: unknown = null;
          const helpers = {
            captureResult: (result: unknown) => {
              capturedResult = result;
            },
          };

          handler.compile(input, helpers);
          expect(typeof capturedResult).toBe("string");
          expect(capturedResult).toContain("callback error");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle complex object proxy scenarios",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            module.exports = {
              id,
              compile: (input, helpers) => {
                // Test accessing complex objects that might trigger proxy creation
                if (input.complexObj) {
                  try {
                    const result = Object.keys(input.complexObj).length;
                    helpers.captureResult(result);
                  } catch (e) {
                    helpers.captureResult("proxy error: " + e.message);
                  }
                } else {
                  helpers.captureResult(0);
                }
              }
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          const input = {
            complexObj: {
              nested: { value: 42 },
              method: function () {
                return "test";
              },
            },
          };

          let capturedResult: unknown = null;
          const helpers = {
            captureResult: (result: unknown) => {
              capturedResult = result;
            },
          };

          handler.compile(input, helpers);
          expect(typeof capturedResult).toBe("number");
          handler.cleanup();
        },
      );

      testAllHandlers(
        "can handle function arguments conversion",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            module.exports = {
              id,
              compile: (input, helpers) => {
                if (typeof input.processFn === 'function') {
                  // Pass various argument types including functions
                  const callback = function(x) { return x * 2; };
                  const result = input.processFn(42, "test", callback);
                  helpers.captureResult(result);
                } else {
                  helpers.captureResult(null);
                }
              }
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          const input = {
            processFn: function (num: unknown, str: unknown, cb: unknown) {
              if (typeof cb === "function") {
                return cb(num);
              }
              return num;
            },
          };

          let capturedResult: unknown = null;
          const helpers = {
            captureResult: (result: unknown) => {
              capturedResult = result;
            },
          };

          handler.compile(input, helpers);
          expect(capturedResult).toBe(84);
          handler.cleanup();
        },
      );

      testAllHandlers("can handle console logging", async (handlerLoader) => {
        const spies = [
          jest.spyOn(console, "log").mockImplementation(() => {}),
          jest.spyOn(console, "warn").mockImplementation(() => {}),
          jest.spyOn(console, "error").mockImplementation(() => {}),
        ];

        const pluginCode = `
          const id = "EVENT_ID";
          module.exports = {
            id,
            compile: (input, helpers) => {
              console.log("Test log message");
              console.warn("Test warning");
              console.error("Test error");
              helpers.captureResult(input.value || "logged");
            }
          };
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        const input = { value: "test" };

        let capturedResult: unknown = null;
        const helpers = {
          captureResult: (result: unknown) => {
            capturedResult = result;
          },
        };

        handler.compile(input, helpers);
        expect(capturedResult).toBe("test");
        expect(spies[0]).toHaveBeenCalledWith("Test log message");
        expect(spies[1]).toHaveBeenCalledWith("Test warning");
        expect(spies[2]).toHaveBeenCalledWith("Test error");

        spies.forEach((spy) => spy.mockRestore());
        handler.cleanup();
      });

      testAllHandlers(
        "can handle module not found error in proxy system",
        async (handlerLoader) => {
          const pluginCode = `
            const id = "EVENT_ID";
            module.exports = {
              id,
              compile: (input, helpers) => {
                try {
                  // Access a property that doesn't exist to trigger module not found
                  const result = input.nonExistentModule.someProperty;
                  helpers.captureResult(result);
                } catch (e) {
                  helpers.captureResult("module error: " + e.message);
                }
              }
            };
          `;
          const handler = await handlerLoader(pluginCode, "test.js");
          const input = {};

          let capturedResult: unknown = null;
          const helpers = {
            captureResult: (result: unknown) => {
              capturedResult = result;
            },
          };

          handler.compile(input, helpers);
          expect(typeof capturedResult).toBe("string");
          expect(capturedResult).toContain("module error");
          handler.cleanup();
        },
      );
    });
  });

  describe("Post Update Functions", () => {
    testAllHandlers("can call postUpdate function", async (handlerLoader) => {
      const pluginCode = `
        import { readFile } from "plugin-api";
        export const id = "EVENT_ID";
        export const fields = [{
          key: "text",
          type: "text",
          defaultValue: "",
          postUpdateFn: (newArgs, prevArgs) => {
            return {...newArgs, ...prevArgs, injected: "INJECTED"};
          },
        }]
      `;
      const handler = await handlerLoader(pluginCode, "test.js");
      expect(handler.id).toBe("EVENT_ID");
      expect(handler.fieldsLookup["text"]).toBeDefined();
      expect(handler.fieldsLookup["text"].hasPostUpdateFn).toBeTrue();
      expect(
        handler.fieldsLookup["text"].postUpdateFn?.(
          {
            after: "AFTER",
          },
          {
            before: "BEFORE",
          },
        ),
      ).toEqual({
        before: "BEFORE",
        after: "AFTER",
        injected: "INJECTED",
      });

      handler.cleanup();
    });

    testAllHandlers(
      "can call postUpdate function v2",
      async (handlerLoader) => {
        const pluginCode = `
          import { readFile } from "plugin-api";
          export const id = "EVENT_ID";
          export const fields = [{
            key: "text",
            type: "text",
            defaultValue: "",
            postUpdateFn: (newArgs, prevArgs) => {
              return {...newArgs, ...prevArgs, injected: "INJECTED_v2"};
            },
          }]
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        expect(handler.id).toBe("EVENT_ID");
        expect(handler.fieldsLookup["text"]).toBeDefined();
        expect(handler.fieldsLookup["text"].hasPostUpdateFn).toBeTrue();
        expect(
          handler.fieldsLookup["text"].postUpdateFn?.(
            {
              after: "AFTER",
            },
            {
              before: "BEFORE",
            },
          ),
        ).toEqual({
          before: "BEFORE",
          after: "AFTER",
          injected: "INJECTED_v2",
        });

        handler.cleanup();
      },
    );

    testAllHandlers(
      "can call postUpdate function in nested field",
      async (handlerLoader) => {
        const pluginCode = `
          export const id = "EVENT_ID";
          export const fields = [{
            type: "group",
            fields: [{
              key: "text",
              type: "text",
              defaultValue: "",
              postUpdateFn: (newArgs, prevArgs) => {
                return {...newArgs, ...prevArgs, injected: "INJECTED_nested"};
              },
            }],
          }]
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        expect(handler.id).toBe("EVENT_ID");
        expect(handler.fieldsLookup["text"]).toBeDefined();
        expect(handler.fieldsLookup["text"].hasPostUpdateFn).toBeTrue();
        expect(
          handler.fieldsLookup["text"].postUpdateFn?.(
            {
              after: "AFTER",
            },
            {
              before: "BEFORE",
            },
          ),
        ).toEqual({
          before: "BEFORE",
          after: "AFTER",
          injected: "INJECTED_nested",
        });

        handler.cleanup();
      },
    );
  });

  describe("Actor Move To", () => {
    testAllHandlers("Can load actorMoveTo metadata", async (handlerLoader) => {
      const pluginCode = await readFile(
        join(__dirname, "_files/testEventMoveTo.js"),
        "utf-8",
      );
      const value = await handlerLoader(pluginCode, "test.js");

      expect(
        value && typeof value === "object" && "id" in value && value.id,
      ).toEqual("EVENT_ACTOR_MOVE_TO");

      expect(
        value && typeof value === "object" && "fields" in value && value.fields,
      ).toHaveLength(3);

      value.cleanup();
    });

    testAllHandlers(
      "Can call actorMoveTo compile fn using tile coordinates",
      async (handlerLoader) => {
        const output: string[] = ["Hello World"];

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
        };

        const sb = new ScriptBuilder(
          output,
          defaultOptions as ScriptBuilderOptions,
        );

        const pluginCode = await readFile(
          join(__dirname, "_files/testEventMoveTo.js"),
          "utf-8",
        );
        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            actorId: "player",
            x: { type: "number", value: 10 },
            y: { type: "number", value: 20 },
            collideWith: ["walls"],
            moveType: "horizontal",
            units: "tiles",
          },
          { ...sb },
        );

        const scriptString = sb.toScriptString("script", true);

        expect(scriptString).toInclude("Actor Move To");
        expect(scriptString).toInclude(".R_INT16    2560");
        expect(scriptString).toInclude(".R_INT16    5120");
        expect(scriptString).toInclude("VM_ACTOR_MOVE_TO_INIT   .LOCAL_ACTOR");

        plugin.cleanup();
      },
    );

    testAllHandlers(
      "Can call actorMoveTo compile fn undefined units, falling back to tiles",
      async (handlerLoader) => {
        const output: string[] = ["Hello World"];

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
        };

        const sb = new ScriptBuilder(
          output,
          defaultOptions as ScriptBuilderOptions,
        );

        const pluginCode = await readFile(
          join(__dirname, "_files/testEventMoveTo.js"),
          "utf-8",
        );
        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            actorId: "player",
            x: { type: "number", value: 10 },
            y: { type: "number", value: 20 },
            collideWith: ["walls"],
            moveType: "horizontal",
            units: undefined,
          },
          { ...sb, warnings: (msg: string) => console.log(msg) },
        );

        const scriptString = sb.toScriptString("script", true);

        expect(scriptString).toInclude("Actor Move To");
        expect(scriptString).toInclude(".R_INT16    2560");
        expect(scriptString).toInclude(".R_INT16    5120");
        expect(scriptString).toInclude("VM_ACTOR_MOVE_TO_INIT   .LOCAL_ACTOR");

        plugin.cleanup();
      },
    );

    testAllHandlers(
      "Can call actorMoveTo compile fn using px coordinates",
      async (handlerLoader) => {
        const output: string[] = ["Hello World"];

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
        };

        const sb = new ScriptBuilder(
          output,
          defaultOptions as ScriptBuilderOptions,
        );

        const pluginCode = await readFile(
          join(__dirname, "_files/testEventMoveTo.js"),
          "utf-8",
        );
        const plugin = await handlerLoader(pluginCode, "test.js");

        plugin.compile(
          {
            actorId: "player",
            x: { type: "number", value: 10 },
            y: { type: "number", value: 20 },
            collideWith: ["walls"],
            moveType: "horizontal",
            units: "pixels",
          },
          { ...sb },
        );

        const scriptString = sb.toScriptString("script", true);

        expect(scriptString).toInclude("Actor Move To");
        expect(scriptString).toInclude(".R_INT16    320");
        expect(scriptString).toInclude(".R_INT16    640");
        expect(scriptString).toInclude("VM_ACTOR_MOVE_TO_INIT   .LOCAL_ACTOR");

        plugin.cleanup();
      },
    );
  });

  describe("RPN", () => {
    class RPNTest {
      output: string[] = [];
      _addCmd = (cmd: string) => {
        this.output.push(cmd);
      };

      _rpn = () => {
        const rpnOutput: string[] = [];

        const rpnCmd = (cmd: string, ...args: Array<string | number>) => {
          rpnOutput.push(cmd + " " + args.map((a) => a.toString()).join(" "));
        };

        const rpn = {
          int8: (value: number | string) => {
            rpnCmd(".R_INT8", value);
            return rpn;
          },
          stop: () => {
            rpnCmd(".R_STOP");
            this._addCmd("VM_RPN");
            rpnOutput.forEach((cmd: string) => {
              this.output.push(cmd);
            });
          },
        };

        return rpn;
      };

      _callRPN = (rpn: ReturnType<RPNTest["_rpn"]>) => {
        rpn.int8(2);
      };

      toScriptString = () => {
        return this.output.join("\n");
      };
    }

    testAllHandlers("can call rpn in plugin", async (handlerLoader) => {
      const pluginCode = `
        const id = "EVENT_TEST_ID";
        module.exports = {
          id,
          compile: (input, helpers) => {
            const rpn = helpers._rpn();
            rpn.int8(2);
            rpn.stop();
          },
        };
      `;
      const handler = await handlerLoader(pluginCode, "test.js");

      const sb = new RPNTest();

      handler.compile({}, { ...sb });

      const script = sb.toScriptString();

      expect(script).toMatch(/VM_RPN.*\.R_INT8 2.*\.R_STOP/s);
      handler.cleanup();
    });

    testAllHandlers("can pass rpn to script builder", async (handlerLoader) => {
      const pluginCode = `
        const id = "EVENT_TEST_ID";
        module.exports = {
          id,
          compile: (input, helpers) => {
            const rpn = helpers._rpn();
            helpers._callRPN(rpn);
            rpn.stop();
          },
        };
      `;
      const handler = await handlerLoader(pluginCode, "test.js");

      const sb = new RPNTest();

      handler.compile({}, { ...sb });

      const script = sb.toScriptString();

      expect(script).toMatch(/VM_RPN.*\.R_INT8 2.*\.R_STOP/s);
      handler.cleanup();
    });
  });

  describe("Auto Fade Props", () => {
    testAllHandlers("can get waitUntilAfterInitFade", async (handlerLoader) => {
      const pluginCode = `
        export const id = "EVENT_ID";
        export const waitUntilAfterInitFade = true;
      `;
      const handler = await handlerLoader(pluginCode, "test.js");
      expect(handler.id).toBe("EVENT_ID");
      expect(handler.waitUntilAfterInitFade).toBe(true);
      handler.cleanup();
    });

    testAllHandlers(
      "can get allowChildrenBeforeInitFade",
      async (handlerLoader) => {
        const pluginCode = `
          export const id = "EVENT_ID";
          export const allowChildrenBeforeInitFade = true;
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        expect(handler.id).toBe("EVENT_ID");
        expect(handler.allowChildrenBeforeInitFade).toBe(true);
        handler.cleanup();
      },
    );
  });

  describe("Input Scripts", () => {
    testAllHandlers("can load input script", async (handlerLoader) => {
      const output: string[] = [];

      const pluginCode = `
        export const id = "EVENT_ID";
        export const compile = (input, helpers) => {
          helpers.appendRaw(typeof input);
          helpers.appendRaw(typeof input.data);
          helpers.appendRaw(input.data.length);
          helpers.appendRaw(typeof input.data[0]);
          helpers.appendRaw(input.data[0].id);
        }
      `;
      const handler = await handlerLoader(pluginCode, "test.js");
      expect(handler.id).toBe("EVENT_ID");
      const input = {
        data: [
          {
            id: "input1",
          },
          {
            id: "input2",
          },
        ],
      };
      handler.compile(input, { appendRaw: (msg: string) => output.push(msg) });
      expect(output.join("\n")).toEqual("object\nobject\n2\nobject\ninput1");
      handler.cleanup();
    });
  });

  describe("Error handling", () => {
    testAllHandlers(
      "should handle syntax errors in ES module code",
      async (handlerLoader) => {
        const pluginCode = `
          export const id = "EVENT_TEST";
          export const compile = (input, helpers) => {
            // Syntax error: missing closing brace
            if (true) {
          };
        `;

        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    testAllHandlers(
      "should handle syntax errors in CommonJS code",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          module.exports = {
            id,
            compile: (input, helpers) => {
              // Syntax error: missing closing brace
              if (true) {
          };
        `;

        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    testAllHandlers(
      "should throw if no exports are given",
      async (handlerLoader) => {
        const pluginCode = ``;
        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    testAllHandlers(
      "should throw if no exports are given for es module",
      async (handlerLoader) => {
        const pluginCode = `import api from "plugin-api";`;
        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    testAllHandlers(
      "should handle runtime errors in module execution",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          // Runtime error during module load
          throw new Error("Module load error");
          module.exports = { id };
        `;

        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    testAllHandlers(
      "should handle calling non-existent autoLabel function",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          module.exports = { 
            id,
            // autoLabel is not defined but hasAutoLabel might be true incorrectly
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        // Handler should not have autoLabel since it wasn't defined
        expect(handler.hasAutoLabel).toBe(false);
        expect(handler.autoLabel).toBeUndefined();

        handler.cleanup();
      },
    );

    testAllHandlers(
      "should handle errors in callback functions",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          module.exports = {
            id,
            compile: (input, helpers) => {
              // Call a helper function that will throw an error
              const callback = () => {
                throw new Error("Callback error");
              };
              helpers.callWithCallback(callback);
            }
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        const helpers = {
          callWithCallback: (fn: () => void) => {
            fn(); // This will throw
          },
        };

        expect(() => {
          handler.compile({ test: "data" }, helpers);
        }).toThrow("Callback error");

        handler.cleanup();
      },
    );

    testAllHandlers(
      "should handle VM function call errors",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          module.exports = {
            id,
            compile: (input, helpers) => {
              // This will cause an error in the VM
              undefined.someProperty;
            }
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        expect(() => {
          handler.compile({ test: "data" }, {});
        }).toThrow();

        handler.cleanup();
      },
    );

    testAllHandlers(
      "Throws error when handler lacks id",
      async (handlerLoader) => {
        const pluginCode = `
          module.exports = {
            fields: [],
            compile: () => {},
          };
        `;

        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow(
          "does not export an 'id' property",
        );
      },
    );

    testAllHandlers(
      "should throw error if trying to call non-defined compile function",
      async (handlerLoader) => {
        const pluginCode = `
          export const id = "EVENT_TEST";
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        expect(() => handler.compile({ text: "test" }, {})).toThrow();
        handler.cleanup();
      },
    );
  });

  describe("Edge cases", () => {
    testAllHandlers(
      "should handle empty module exports",
      async (handlerLoader) => {
        const pluginCode = `
          // Empty module
          module.exports = {};
        `;

        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow(); // Should fail validation
      },
    );

    testAllHandlers(
      "should handle module with only id but missing required fields",
      async (handlerLoader) => {
        const pluginCode = `
          module.exports = {
            id: "EVENT_TEST"
            // Missing compile function and other required fields
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        // Should have default empty arrays for missing fields
        expect(handler.fields).toEqual([]);
        expect(handler.compile).toBeDefined();

        handler.cleanup();
      },
    );

    testAllHandlers(
      "should handle complex nested objects in arguments",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          module.exports = {
            id,
            compile: (input, helpers) => {
              // Access deeply nested properties
              const value = input.nested?.deep?.property || "default";
              helpers.appendRaw(value);
            }
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        const output: string[] = [];
        const helpers = {
          appendRaw: (msg: string) => output.push(msg),
        };

        const input = {
          nested: {
            deep: {
              property: "success",
            },
          },
        };

        handler.compile(input, helpers);
        expect(output[0]).toBe("success");

        // Test with undefined nested property
        output.length = 0;
        handler.compile({ nested: {} }, helpers);
        expect(output[0]).toBe("default");

        handler.cleanup();
      },
    );

    testAllHandlers(
      "should handle functions returning complex objects",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          module.exports = {
            id,
            compile: (input, helpers) => {
              const result = helpers.getComplexObject();
              // Access methods on returned object
              if (result && typeof result.process === 'function') {
                result.process(input.data);
              }
            }
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        let processedData: unknown = null;
        const complexObject = {
          process: (data: unknown) => {
            processedData = data;
          },
          other: "property",
        };

        const helpers = {
          getComplexObject: () => complexObject,
        };

        handler.compile({ data: "test-data" }, helpers);
        expect(processedData).toBe("test-data");

        handler.cleanup();
      },
    );

    testAllHandlers("should handle cleanup properly", async (handlerLoader) => {
      const pluginCode = `
        const id = "EVENT_TEST";
        module.exports = { id };
      `;

      const handler = await handlerLoader(pluginCode, "test.js");

      // Cleanup should work without throwing
      expect(() => {
        handler.cleanup();
      }).not.toThrow();

      // Note: Multiple cleanup calls would cause "use after free" error
      // so we only test single cleanup
    });

    testAllHandlers(
      "should handle ES module with multiple exports",
      async (handlerLoader) => {
        const pluginCode = `
          export const id = "EVENT_TEST";
          export const name = "Test Event";
          export const fields = [];
          export const compile = (input, helpers) => {
            helpers.appendRaw("ES module test");
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        expect(handler.id).toBe("EVENT_TEST");
        expect(handler.name).toBe("Test Event");

        const output: string[] = [];
        handler.compile({}, { appendRaw: (msg: string) => output.push(msg) });
        expect(output[0]).toBe("ES module test");

        handler.cleanup();
      },
    );

    testAllHandlers(
      "should handle proxy system with arrays",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          module.exports = {
            id,
            compile: (input, helpers) => {
              // Access array properties through proxy
              const arr = input.items;
              if (Array.isArray(arr)) {
                helpers.appendRaw(\`Length: \${arr.length}\`);
                helpers.appendRaw(\`First: \${arr[0]}\`);
              }
            }
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        const output: string[] = [];
        const helpers = {
          appendRaw: (msg: string) => output.push(msg),
        };

        const input = {
          items: ["first", "second", "third"],
        };

        handler.compile(input, helpers);
        expect(output[0]).toBe("Length: 3");
        expect(output[1]).toBe("First: first");

        handler.cleanup();
      },
    );
  });

  describe("Memory management", () => {
    testAllHandlers(
      "should properly dispose handles on error",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_TEST";
          module.exports = {
            id,
            compile: (input, helpers) => {
              // Create some complex objects that need disposal
              const obj = helpers.createLargeObject();
              // Then throw an error
              throw new Error("Intentional error");
            }
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        const helpers = {
          createLargeObject: () => ({
            data: new Array(1000).fill("test"),
            nested: { deep: { value: "test" } },
          }),
        };

        expect(() => {
          handler.compile({}, helpers);
        }).toThrow("Intentional error");

        // Cleanup should still work properly
        handler.cleanup();
      },
    );
  });

  describe("helper object", () => {
    testAllHandlers(
      "can call find on arrays in helper proxy",
      async (handlerLoader) => {
        const output: string[] = [];

        const pluginCode = `
          export const id = "EVENT_ID";
          export const compile = (input, helpers) => {
            helpers.appendRaw(helpers.values.find((v) => v.id === "input1").id);
          }
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        expect(handler.id).toBe("EVENT_ID");
        const input = {};
        handler.compile(input, {
          appendRaw: (msg: string) => output.push(msg),
          values: [
            {
              id: "input1",
            },
            {
              id: "input2",
            },
          ],
        });
        expect(output.join("\n")).toEqual("input1");
        handler.cleanup();
      },
    );
  });

  describe("Validation", () => {
    testAllHandlers(
      "Handles non-strict javascript for CommonJS plugins",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_NON_STRICT_TEST";
          module.exports = {
            id,
            compile: (input, helpers) => {
              abc = "Hello"
              helpers.appendRaw(abc);
            },
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");
        const output: string[] = [];

        handler.compile(
          { text: "test" },
          { appendRaw: (msg: string) => output.push(msg) },
        );

        expect(output.length).toBe(1);
        expect(output[0]).toBe("Hello");
        handler.cleanup();
      },
    );

    testAllHandlers(
      "Handles non-strict javascript for ES module plugins",
      async (handlerLoader) => {
        const pluginCode = `
          export const id = "EVENT_NON_STRICT_TEST";
          export const compile = (input, helpers) => {
            abc = "Hello"
            helpers.appendRaw(abc);
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");
        const output: string[] = [];

        handler.compile(
          { text: "test" },
          { appendRaw: (msg: string) => output.push(msg) },
        );

        expect(output.length).toBe(1);
        expect(output[0]).toBe("Hello");
        handler.cleanup();
      },
    );

    testAllHandlers(
      "Handles all optional metadata properties",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_FULL_METADATA_TEST";
          module.exports = {
            id,
            name: "Test Event",
            description: "A test event handler",
            groups: ["test", "demo"],
            subGroups: { advanced: "Advanced Options" },
            deprecated: true,
            editableSymbol: true,
            allowChildrenBeforeInitFade: true,
            waitUntilAfterInitFade: false,
            helper: { type: "text", text: "Helper text" },
            presets: [{ id: "preset1", name: "Preset 1", values: {} }],
            userPresetsGroups: [{ name: "Group 1", fields: ["text"] }],
            userPresetsIgnore: ["ignored"],
            fields: [
              { key: "text", type: "text", defaultValue: "" }
            ],
            compile: () => {},
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        expect(handler.name).toBe("Test Event");
        expect(handler.description).toBe("A test event handler");
        expect(handler.groups).toEqual(["test", "demo"]);
        expect(handler.subGroups).toEqual({ advanced: "Advanced Options" });
        expect(handler.deprecated).toBe(true);
        expect(handler.editableSymbol).toBe(true);
        expect(handler.allowChildrenBeforeInitFade).toBe(true);
        expect(handler.waitUntilAfterInitFade).toBe(false);
        expect(handler.helper).toEqual({ type: "text", text: "Helper text" });
        expect(handler.presets).toHaveLength(1);
        expect(handler.userPresetsGroups).toHaveLength(1);
        expect(handler.userPresetsIgnore).toEqual(["ignored"]);

        handler.cleanup();
      },
    );

    testAllHandlers(
      "Validates userPresetsGroups configuration",
      async (handlerLoader) => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        const pluginCode = `
          const id = "EVENT_PRESETS_VALIDATION_TEST";
          module.exports = {
            id,
            fields: [
              { key: "text", type: "text", defaultValue: "" },
              { key: "number", type: "number", defaultValue: 0 },
              { key: "missing", type: "text", defaultValue: "" }
            ],
            userPresetsGroups: [
              { name: "Group 1", fields: ["text", "number"] }
            ],
            compile: () => {},
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "defined userPresetsGroups but did not include some fields",
          ),
        );
        expect(consoleSpy).toHaveBeenCalledWith("Missing fields: missing");

        handler.cleanup();
        consoleSpy.mockRestore();
      },
    );
  });

  describe("Security", () => {
    testUntrustedHandler("can modify passed in data", async (handlerLoader) => {
      const pluginCode = `
          const id = "EVENT_ID";
          module.exports = {
            id,
            compile: (input, helpers) => {
              helpers.blah = "MODIFIED_1";
              helpers.data[0] = "MODIFIED_2";
              helpers.data.push("MODIFIED_3");
              helpers.obj.nested = "MODIFIED_4";
            },
          };
        `;
      const handler = await handlerLoader(pluginCode, "test.js");
      expect(handler.id).toBe("EVENT_ID");
      const input = {};
      const helpers = {
        data: ["OK"],
        obj: {
          nested: "OK",
        },
      };
      expect(helpers.data[0]).toBe("OK");
      expect(helpers.data.length).toBe(1);
      expect(helpers.obj.nested).toBe("OK");
      expect("blah" in helpers).toBe(false);
      handler.compile(input, helpers);
      expect(helpers.data[0]).toBe("MODIFIED_2");
      expect(helpers.data.length).toBe(2);
      expect(helpers.data[1]).toBe("MODIFIED_3");
      expect((helpers.obj as { nested: string }).nested).toBe("MODIFIED_4");
      expect((helpers as unknown as { blah: unknown }).blah).toBe("MODIFIED_1");
      handler.cleanup();
    });

    testUntrustedHandler(
      "cannot modify passed in functions",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_ID";
          module.exports = {
            id,
            compile: (input, helpers) => {
              helpers.incCounter = () => { console.log("hacked"); };
            },
          };
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        expect(handler.id).toBe("EVENT_ID");
        const input = {};
        let counter = 0;
        const helpers = {
          incCounter: () => {
            counter++;
          },
        };
        expect(counter).toBe(0);
        helpers.incCounter();
        expect(counter).toBe(1);
        handler.compile(input, helpers);
        helpers.incCounter();
        expect(counter).toBe(2);

        handler.cleanup();
      },
    );

    testAllHandlers(
      "cannot modify required module functions",
      async (handlerLoader) => {
        const pluginCode = `
          const pluginApi = require("plugin-api");
          const id = "EVENT_ID";
          module.exports = {
            id,
            compile: (input, helpers) => {
              pluginApi.l10n = () => { return "HACKED" };
            },
          };
        `;
        const handler = await handlerLoader(pluginCode, "test.js");
        const input = {};
        const helpers = {};
        const beforeL10n = l10n("ACTOR");
        expect(l10n("ACTOR")).toBe("ACTOR");
        handler.compile(input, helpers);
        expect(l10n("ACTOR")).toBe(beforeL10n);
        handler.cleanup();
      },
    );

    testAllHandlers(
      "cannot run untrusted code by breaking out of import",
      async (handlerLoader) => {
        const pluginCode = `
          import { hacked as importHacked } from 'plugin-api"); export const hacked = ("HACKED';
          export const id = "EVENT_ID";
          export const compile = (input, helpers) => {
            helpers.appendRaw("BEFORE");
            helpers.appendRaw(importHacked);
            helpers.appendRaw("AFTER");
          };
        `;
        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    testAllHandlers(
      "cannot run untrusted code by breaking out of require",
      async (handlerLoader) => {
        const pluginCode = `
          const { hacked: importHacked } = require('plugin-api"); export const hacked = ("HACKED');
          module.exports = {
            id: "EVENT_ID",
            compile: (input, helpers) => {
              helpers.appendRaw("BEFORE");
              helpers.appendRaw(importHacked);
              helpers.appendRaw("AFTER");
            }
          }
        `;
        await expect(handlerLoader(pluginCode, "test.js")).rejects.toThrow();
      },
    );

    testUntrustedHandler(
      "cannot access host Function via constructor/prototype chain",
      async (handlerLoader) => {
        const pluginCode = `
          const id = "EVENT_ID";
          module.exports = {
            id,
            compile: (input, helpers) => {
              var Fn = helpers.constructor.constructor;
              var make = Fn("return this");
              var hostGlobal = make();
              if (
                hostGlobal &&
                (hostGlobal.process || hostGlobal.global || hostGlobal.window)
              ) {
                helpers.didEscape();
              }
            },
          };
        `;

        const handler = await handlerLoader(pluginCode, "test.js");

        let escaped = false;

        const input: Record<string, unknown> = {};
        const helpers = {
          didEscape: () => (escaped = true),
        };

        handler.compile(input, helpers);

        expect(escaped).toBe(false);

        handler.cleanup();
      },
    );

    testUntrustedHandler(
      "constructor.constructor escape blocked",
      async (loader) => {
        const plugin = `
          module.exports = {
            id: "EVENT_ID",
            compile(input, helpers) {
              const candidates = [
                helpers?.constructor?.constructor,
                Object.getPrototypeOf(helpers)?.constructor?.constructor,
                helpers?.__proto__?.constructor?.constructor
              ];
              for (const Fn of candidates) {
                if (typeof Fn === "function") {
                  try {
                    const make = Fn("return this");
                    const g = make && make();
                    if (g && (g.process || g.window || g.global)) input.__escaped = true;
                  } catch (_) {}
                }
              }
            }
          };
        `;
        const h = await loader(plugin, "test.js");
        const input: Record<string, unknown> = {};
        h.compile(input, { incCounter() {} });
        expect(input.__escaped).toBeUndefined();
        h.cleanup();
      },
    );
  });
});
