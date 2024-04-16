import { compile } from "../../src/lib/events/eventCameraMoveTo";

test("Should be able to move camera position", () => {
  const mockCameraMoveToScriptValues = jest.fn();

  compile(
    {
      x: {
        type: "number",
        value: 5,
      },
      y: {
        type: "number",
        value: 9,
      },
      speed: 1,
      units: "tiles",
    },
    {
      cameraMoveToScriptValues: mockCameraMoveToScriptValues,
    }
  );
  expect(mockCameraMoveToScriptValues).toBeCalledWith(
    { type: "number", value: 5 },
    { type: "number", value: 9 },
    1,
    "tiles"
  );
});
