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
  randomWalk: 5,
  rotateTRB: 6
};

const MOVEMENT_SPEED_LOOKUP = [0, 1, 2, 4, 8];

const OPERATOR_LOOKUP = {
  "==": 1,
  "!=": 2,
  "<": 3,
  ">": 4,
  "<=": 5,
  ">=": 6
};

const KEY_BITS = {
  left: 0x02,
  right: 0x01,
  up: 0x04,
  down: 0x08,
  a: 0x10,
  b: 0x20,
  select: 0x40,
  start: 0x80
};

const inputDec = input => {
  let output = 0;
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      output |= KEY_BITS[input[i]];
    }
  } else {
    output = KEY_BITS[input];
  }
  if (output === 0) {
    // If no input set game would hang
    // as could not continue on, assume
    // this isn't what user wants and
    // instead allow any input
    output = 255;
  }
  return output;
};

const nameToCName = name => {
  return name
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/[^A-Za-z0-9_]/g, "");
};

const dirDec = dir => DIR_LOOKUP[dir] || 1;

const moveDec = move => MOVEMENT_LOOKUP[move] || 1;

const moveSpeedDec = moveSpeed =>
  MOVEMENT_SPEED_LOOKUP[moveSpeed] !== undefined
    ? MOVEMENT_SPEED_LOOKUP[moveSpeed]
    : 1;

const animSpeedDec = animSpeed => (animSpeed !== undefined ? animSpeed : 3);

const operatorDec = operator => OPERATOR_LOOKUP[operator] || 1;

const combineMultipleChoiceText = args => {
  const trueText = args.trueText.slice(0, 17) || "Choice A";
  const falseText = args.falseText.slice(0, 17) || "Choice B";
  return `${trueText}\n${falseText}`;
};

module.exports = {
  nameToCName,
  dirDec,
  inputDec,
  moveDec,
  moveSpeedDec,
  animSpeedDec,
  operatorDec,
  combineMultipleChoiceText
};
