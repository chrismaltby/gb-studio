import { compile } from "../../src/lib/events/eventCameraShake";

test("Should be able to shake camera for a second", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      shakeDirection: "diagonal",
      time: 1,
      magnitude: {
        type: "number",
        value: 5,
      },
    },
    {
      cameraShakeScriptValue: mockCameraShake,
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, true, 60, {
    type: "number",
    value: 5,
  });
});

test("Should shake camera for half a second if time not set", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      magnitude: {
        type: "number",
        value: 5,
      },
    },
    {
      cameraShakeScriptValue: mockCameraShake,
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, false, 30, {
    type: "number",
    value: 5,
  });
});

test("Should shake camera horizontally if directions not set", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      time: 1,
      magnitude: {
        type: "number",
        value: 5,
      },
    },
    {
      cameraShakeScriptValue: mockCameraShake,
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, false, 60, {
    type: "number",
    value: 5,
  });
});

test("Should shake camera horizontally if direction set to horizontal", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      shakeDirection: "horizontal",
      time: 1,
      magnitude: {
        type: "number",
        value: 5,
      },
    },
    {
      cameraShakeScriptValue: mockCameraShake,
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, false, 60, {
    type: "number",
    value: 5,
  });
});

test("Should shake camera vertically if direction set to vertical", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      shakeDirection: "vertical",
      time: 1,
      magnitude: {
        type: "number",
        value: 5,
      },
    },
    {
      cameraShakeScriptValue: mockCameraShake,
    }
  );
  expect(mockCameraShake).toBeCalledWith(false, true, 60, {
    type: "number",
    value: 5,
  });
});

test("Should be able to set shake camera magnitude from a variable", () => {
  const mockCameraShakeVariables = jest.fn();
  const variable = {
    type: "variable",
    value: "L0",
  };
  compile(
    {
      shakeDirection: "diagonal",
      time: 1.5,
      magnitude: variable,
    },
    {
      cameraShakeScriptValue: mockCameraShakeVariables,
    }
  );
  expect(mockCameraShakeVariables).toBeCalledWith(true, true, 90, {
    type: "variable",
    value: "L0",
  });
});
