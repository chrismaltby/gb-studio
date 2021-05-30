const id = "EVENT_FADE_OUT";

const fields = [
  {
    key: "speed",
    type: "fadeSpeed",
    defaultValue: "2"
  }
];

const compile = (input, helpers) => {
  const { fadeOut } = helpers;
  fadeOut(input.speed);
};

module.exports = {
  id,
  fields,
  compile
};
