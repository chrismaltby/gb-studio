import { calculateAutoFadeEventId } from "../../src/shared/lib/scripts/eventHelpers";
import initElectronL10N from "../../src/lib/lang/initElectronL10N";
import { getTestScriptHandlersLookup } from "../getTestScriptHandlersLookup";

beforeAll(async () => {
  await initElectronL10N();
});

test("Should generate scene init fade in before a waitUntilAfterInitFade event", async () => {
  const scriptEventHandlersLookup = await getTestScriptHandlersLookup();
  const output = calculateAutoFadeEventId(
    [
      {
        id: "event1",
        command: "EVENT_CAMERA_SHAKE",
        args: {
          time: "0.1",
          shakeDirection: "horizontal",
        },
      },
    ],
    {},
    scriptEventHandlersLookup
  );
  expect(output).toEqual("event1");
});

test("Should not generate scene init fade in until reached waitUntilAfterInitFade event", async () => {
  const scriptEventHandlersLookup = await getTestScriptHandlersLookup();
  const output = calculateAutoFadeEventId(
    [
      {
        id: "event1",
        command: "EVENT_INC_VALUE",
        args: {
          variable: "0",
        },
      },
      {
        id: "event2",
        command: "EVENT_CAMERA_SHAKE",
        args: {
          time: "0.1",
          shakeDirection: "horizontal",
        },
      },
    ],
    {},
    scriptEventHandlersLookup
  );

  expect(output).toEqual("event2");
});

test("Should generate scene init fade in at end of script when required", async () => {
  const scriptEventHandlersLookup = await getTestScriptHandlersLookup();
  const output = calculateAutoFadeEventId(
    [
      {
        id: "event1",
        command: "EVENT_INC_VALUE",
        args: {
          variable: "0",
        },
      },
    ],
    {},
    scriptEventHandlersLookup
  );

  expect(output).toEqual("");
});

test("Should not generate scene init fade in if manual fade is provided", async () => {
  const scriptEventHandlersLookup = await getTestScriptHandlersLookup();
  const output = calculateAutoFadeEventId(
    [
      {
        id: "event1",
        command: "EVENT_FADE_IN",
        args: {
          speed: "6",
        },
      },
    ],
    {},
    scriptEventHandlersLookup
  );

  expect(output).toEqual("MANUAL");
});

test("Should generate scene init fade in before a conditional that contains waitUntilAfterInitFade events", async () => {
  const scriptEventHandlersLookup = await getTestScriptHandlersLookup();
  const output = calculateAutoFadeEventId(
    [
      {
        id: "event1",
        command: "EVENT_IF_TRUE",
        args: {
          variable: "0",
        },
        children: {
          true: [
            {
              id: "event2",
              command: "EVENT_CAMERA_SHAKE",
              args: {
                time: "0.1",
                shakeDirection: "horizontal",
              },
            },
          ],
          false: [
            {
              id: "event3",
              command: "EVENT_CAMERA_SHAKE",
              args: {
                time: "0.1",
                shakeDirection: "horizontal",
              },
            },
          ],
        },
      },
    ],
    {},
    scriptEventHandlersLookup
  );

  expect(output).toEqual("event1");
});
