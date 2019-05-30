export const id = "EVENT_CAMERA_LOCK";

export const fields = [
  {
    key: "speed",
    type: "cameraSpeed",
    defaultValue: "0"
  }
];

export const compile = (input, helpers) => {
  const { cameraLock } = helpers;
  cameraLock(input.speed);
};
