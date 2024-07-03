import {
  ScriptEventDefs,
  isActorField,
} from "shared/lib/scripts/scriptDefHelpers";

test('should identify fields starting with "$actor[" as actor fields from custom events', () => {
  expect(isActorField("EVENT_TEST", "$actor[0]", {}, {})).toEqual(true);
});

test('should identify fields with type "actor" as actor fields', () => {
  expect(
    isActorField("EVENT_TEST", "test", {}, {
      EVENT_TEST: {
        id: "EVENT_TEST",
        fieldsLookup: {
          test: {
            key: "test",
            type: "actor",
          },
        },
      },
    } as unknown as ScriptEventDefs)
  ).toEqual(true);
});

test('should not identify fields without type "actor" as actor fields', () => {
  expect(
    isActorField("EVENT_TEST", "test", {}, {
      EVENT_TEST: {
        id: "EVENT_TEST",
        fieldsLookup: {
          test: {
            key: "test",
            type: "number",
          },
        },
      },
    } as unknown as ScriptEventDefs)
  ).toEqual(false);
});
