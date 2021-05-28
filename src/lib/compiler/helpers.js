import { SPRITE_TYPE_STATIC } from "../../consts";

const DIR_LOOKUP = {
  down: 1,
  left: 2,
  right: 4,
  up: 8,
};

const DIR_ENUM_LOOKUP = {
  down: "DIR_DOWN",
  left: "DIR_LEFT",
  right: "DIR_RIGHT",
  up: "DIR_UP",
};

const MOVEMENT_LOOKUP = {
  static: 1,
  playerInput: 2,
  randomFace: 3,
  faceInteraction: 4,
  randomWalk: 5,
  rotateTRB: 6,
};

const MOVEMENT_SPEED_LOOKUP = [0, 1, 2, 4, 8];

const TEXT_SPEED_LOOKUP = [0x0, 0x1, 0x3, 0x7, 0xf, 0x1f];

const OPERATOR_LOOKUP = {
  "==": 1,
  "!=": 2,
  "<": 3,
  ">": 4,
  "<=": 5,
  ">=": 6,
};

const KEY_BITS = {
  left: 0x02,
  right: 0x01,
  up: 0x04,
  down: 0x08,
  a: 0x10,
  b: 0x20,
  select: 0x40,
  start: 0x80,
};

export const inputDec = (input) => {
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

export const nameToCName = (name) => {
  return name
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/[^A-Za-z0-9_]/g, "");
};

export const dirEnum = (dir) => DIR_ENUM_LOOKUP[dir] || "DIR_DOWN";

export const dirDec = (dir) => DIR_LOOKUP[dir] || 1;

export const dirToXDec = (dir) => {
  const d = dirDec(dir);
  if (d === 2) {
    // Facing left
    return -1;
  }
  if (d === 4) {
    // Facing right
    return 1;
  }
  return 0;
};

export const dirToYDec = (dir) => {
  const d = dirDec(dir);
  if (d === 8) {
    // Facing up
    return -1;
  }
  if (d === 1) {
    // Facing down
    return 1;
  }
  return 0;
};

export const moveDec = (move) => MOVEMENT_LOOKUP[move] || 1;

export const moveSpeedDec = (moveSpeed) =>
  MOVEMENT_SPEED_LOOKUP[moveSpeed] !== undefined
    ? MOVEMENT_SPEED_LOOKUP[moveSpeed]
    : 1;

export const animSpeedDec = (animSpeed) => {
  if (animSpeed === "" || animSpeed === null) {
    return 255;
  }
  if (animSpeed === undefined) {
    return 3;
  }
  return animSpeed;
};

export const operatorDec = (operator) => OPERATOR_LOOKUP[operator] || 1;

export const spriteTypeDec = (spriteType, numFrames) => {
  if (spriteType === SPRITE_TYPE_STATIC) {
    // If movement type is static and cycling frames, always set as static sprite
    return 0;
  }
  if (numFrames === 6) {
    return 2; // Actor Animated
  }
  if (numFrames === 3) {
    return 1; // Actor
  }
  // Static;
  return 0;
};

export const actorFramesPerDir = (spriteType, numFrames) => {
  if (spriteType === SPRITE_TYPE_STATIC) {
    // If movement type is static and cycling frames
    return numFrames;
  }
  if (numFrames === 6) {
    return 2; // Actor Animated
  }
  if (numFrames === 3) {
    return 1; // Actor
  }
  // Static;
  return numFrames;
};

export const replaceInvalidCustomEventVariables = (variable) => {
  const getValidVariableIndex = (v) => {
    const variableIndex = parseInt(String(v).replace(/^L|^T/, ""), 10);
    if (variableIndex >= 10 || isNaN(variableIndex)) {
      return "0";
    }
    return String(variableIndex);
  };

  // Support the case for "union" values
  if (variable && variable.type === "variable") {
    return {
      ...variable,
      value: getValidVariableIndex(variable.value),
    };
  }
  return getValidVariableIndex(variable);
};

export const replaceInvalidCustomEventActors = (actor) => {
  if (
    actor.indexOf("-") > -1 ||
    parseInt(actor, 10) >= 10 ||
    actor === "$self$"
  ) {
    return "0";
  }
  return actor;
};

export const replaceInvalidCustomEventProperties = (property) => {
  const getValidPropertyValue = (p) => {
    const actorValue = p.replace(/:.*/, "");
    return p.replace(/.*:/, `${replaceInvalidCustomEventActors(actorValue)}:`);
  };

  // Support the case for "union" values
  if (property !== null && property.type === "property") {
    return {
      ...property,
      value: getValidPropertyValue(property.value),
    };
  }
  return getValidPropertyValue(property);
};

export const collisionGroupDec = (group) => {
  if (group === "player") {
    return 1;
  }
  if (group === "1") {
    return 2;
  }
  if (group === "2") {
    return 4;
  }
  if (group === "3") {
    return 8;
  }
  return 0;
};

export const collisionMaskDec = (mask) => {
  if (!Array.isArray(mask)) {
    return 0;
  }
  return mask.reduce((memo, group) => {
    return memo | collisionGroupDec(group);
  }, 0);
};

export const actorRelativeDec = (operation) => {
  if (operation === "up") {
    return 0;
  }
  if (operation === "down") {
    return 1;
  }
  if (operation === "left") {
    return 2;
  }
  if (operation === "right") {
    return 3;
  }
  return 0;
};

export const moveTypeDec = (type) => {
  if (type === "horizontal") {
    return 0;
  }
  if (type === "vertical") {
    return 1;
  }
  if (type === "diagonal") {
    return 2;
  }
  return 0;
};

export const heightDec = (type) => {
  if (type === "low") {
    return 0;
  }
  if (type === "medium") {
    return 1;
  }
  if (type === "high") {
    return 2;
  }
  return 1;
};

export const textSpeedDec = (speed) =>
  TEXT_SPEED_LOOKUP[speed] !== undefined ? TEXT_SPEED_LOOKUP[speed] : 0x1;

export const paletteMaskDec = (mask) => {
  return mask.reduce((memo, value, index) => {
    if (!value) {
      return memo;
    }
    return memo + Math.pow(2, index);
  }, 0);
};
