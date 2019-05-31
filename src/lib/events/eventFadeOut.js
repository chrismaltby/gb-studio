export const id = "EVENT_FADE_OUT";

export const fields = [
  {
    key: "speed",
    type: "fadeSpeed",
    defaultValue: "2"
  }
];

export const compile = (input, helpers) => {
  const { fadeOut } = helpers;
  fadeOut(input.speed);
};
