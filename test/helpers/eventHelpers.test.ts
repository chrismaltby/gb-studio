import { calculateAutoFadeEventIdDenormalised } from "../../src/lib/helpers/eventHelpers";

test("Should generate scene init fade in before a waitUntilAfterInitFade event", () => {
  const output = calculateAutoFadeEventIdDenormalised(
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
    {}
  );
  expect(output).toEqual("event1");
});

test("Should not generate scene init fade in until reached waitUntilAfterInitFade event", () => {
  const output = calculateAutoFadeEventIdDenormalised(
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
    {}
  );

  expect(output).toEqual("event2");
});

test("Should generate scene init fade in at end of script when required", () => {
  const output = calculateAutoFadeEventIdDenormalised(
    [
      {
        id: "event1",
        command: "EVENT_INC_VALUE",
        args: {
          variable: "0",
        },
      },
    ],
    {}
  );

  expect(output).toEqual("");
});

test("Should not generate scene init fade in if manual fade is provided", () => {
  const output = calculateAutoFadeEventIdDenormalised(
    [
      {
        id: "event1",
        command: "EVENT_FADE_IN",
        args: {
          speed: "6",
        },
      },
    ],
    {}
  );

  expect(output).toEqual("MANUAL");
});

test("Should generate scene init fade in before a conditional that contains waitUntilAfterInitFade events", () => {
  const output = calculateAutoFadeEventIdDenormalised(
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
    {}
  );

  expect(output).toEqual("event1");
});
