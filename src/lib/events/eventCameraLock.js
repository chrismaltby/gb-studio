const id = "EVENT_CAMERA_LOCK";
const groups = ["EVENT_GROUP_SCREEN"];

const fields = [
  {
    key: "speed",
    type: "cameraSpeed",
    defaultValue: 0,
  },
];

const compile = (input, helpers) => {
  const { cameraLock } = helpers;
  cameraLock(Number(input.speed));
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
