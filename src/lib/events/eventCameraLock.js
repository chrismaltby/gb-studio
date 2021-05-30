const id = "EVENT_CAMERA_LOCK";

const fields = [
  {
    key: "speed",
    type: "cameraSpeed",
    defaultValue: "0"
  }
];

const compile = (input, helpers) => {
  const { cameraLock } = helpers;
  cameraLock(input.speed);
};

module.exports = {
  id,
  fields,
  compile
};
