export const id = "EVENT_FADE_IN";

export const fields = [
  {
    key: "speed",
    type: "fadeSpeed",
    defaultValue: "2"
  }
];

export const compile = (input, helpers) => {
  const { fadeIn } = helpers;
  fadeIn(input.speed);
};
