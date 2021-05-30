const id = "EVENT_FADE_IN";

const fields = [
  {
    key: "speed",
    type: "fadeSpeed",
    defaultValue: "2"
  }
];

const compile = (input, helpers) => {
  const { fadeIn } = helpers;
  fadeIn(input.speed);
};

module.exports = {
  id,
  fields,
  compile
};
