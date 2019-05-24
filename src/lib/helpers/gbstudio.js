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

export const directionToFrame = (direction, numFrames) => {
  if (numFrames !== 6 && numFrames !== 3) {
    return 0;
  }
  const framesPerDirection = numFrames === 6 ? 2 : 1;
  if (direction === "down") {
    return 0;
  }
  if (direction === "up") {
    return framesPerDirection;
  }
  return framesPerDirection * 2;
};
