/* eslint-disable import/prefer-default-export */
export const spriteTypeFromNumFrames = numFrames => {
  if (numFrames === 6) {
    return "actor_animated";
  }
  if (numFrames === 3) {
    return "actor";
  }
  if (numFrames === 1) {
    return "static";
  }
  return "animated";
};
