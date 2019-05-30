import { compile } from "../../src/lib/events/eventCameraShake";

test("Should be able to shake camera for a second", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      time: 1
    },
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(60);
});

test("Should shake camera for half a second if time not set", () => {
  const mockCameraShake = jest.fn();
  compile(
    {},
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(30);
});

test("Should be able to shake camera for one and a half seconds", () => {
  const mockCameraShake = jest.fn();
  compile(
    {
      time: 1.5
    },
    {
      cameraShake: mockCameraShake
    }
  );
  expect(mockCameraShake).toBeCalledWith(60);
  expect(mockCameraShake).toBeCalledWith(30);
});
