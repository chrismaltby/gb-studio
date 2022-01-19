const id = "EVENT_FADE_IN";
const groups = ["EVENT_GROUP_SCREEN", "EVENT_GROUP_CAMERA"];

const fields = [
  {
    key: "speed",
    type: "fadeSpeed",
    defaultValue: "2",
  },
];

const compile = (input, helpers) => {
  const { fadeIn, nextFrameAwait } = helpers;
  nextFrameAwait();
  fadeIn(input.speed);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
