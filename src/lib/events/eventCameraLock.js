const id = "EVENT_CAMERA_LOCK";
const group = "EVENT_GROUP_CAMERA";

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
  group,
  fields,
  compile,
};
