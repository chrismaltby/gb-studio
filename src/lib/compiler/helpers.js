const DIR_LOOKUP = {
  down: 1,
  left: 2,
  right: 4,
  up: 8
};

const MOVEMENT_LOOKUP = {
  static: 1,
  playerInput: 2,
  randomFace: 3,
  faceInteraction: 4,
  randomWalk: 5
};

const nameToCName = name => {
  return name
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/[^A-Za-z0-9_]/g, "");
};

const dirDec = dir => DIR_LOOKUP[dir] || 1;

const moveDec = move => MOVEMENT_LOOKUP[move] || 1;

module.exports = {
  nameToCName,
  dirDec,
  moveDec
};
