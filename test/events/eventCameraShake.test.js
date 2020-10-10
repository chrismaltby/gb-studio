import { compile } from "../../src/lib/events/eventCameraShake";

test("Should be able to shake camera for a second", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      shakeDirection: "diagonal",
      time: 1
    },
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, true, 60);
});

test("Should shake camera for half a second if time not set", () => {
  const mockCameraShake = jest.fn();
  compile(
    {},
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, false, 30);
});

test("Should shake camera horizontally if directions not set", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      time: 1
    },
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, false, 60);
});

test("Should shake camera horizontally if direction set to horizontal", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      shakeDirection: "horizontal",
      time: 1
    },
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, false, 60);
});

test("Should shake camera vertically if direction set to vertical", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      shakeDirection: "vertical",
      time: 1
    },
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(false, true, 60);
});

test("Should be able to shake camera for one and a half seconds", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      shakeDirection: "diagonal",
      time: 1.5
    },
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(true, true, 60);
  expect(mockCameraShake).toBeCalledWith(true, true, 30);
});
