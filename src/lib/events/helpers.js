import { commandIndex as cmd, JUMP } from "./scriptCommands";

export const getActorIndex = (actorId, scene) => {
  return scene.actors.findIndex((a) => a.id === actorId) + 1;
};

export const getActor = (actorId, scene) => {
  return scene.actors.find((a) => a.id === actorId);
};

export const getMusicIndex = (musicId, music) => {
  const musicIndex = music.findIndex((track) => track.id === musicId);
  return musicIndex;
};

export const getSpriteIndex = (spriteId, sprites) => {
  const spriteIndex = sprites.findIndex((sprite) => sprite.id === spriteId);
  if (spriteIndex === -1) {
    return 0;
  }
  return spriteIndex;
};

export const getSprite = (spriteId, sprites) => {
  return sprites.find((sprite) => sprite.id === spriteId);
};

export const getSpriteOffset = (spriteId, sprites, scene) => {
  const spriteIndex = getSpriteIndex(spriteId, sprites);

  let spriteOffset = 6;
  for (let i = 0; i < scene.sprites.length; i++) {
    if (scene.sprites[i] === spriteIndex) {
      break;
    }
    const sprite = sprites[scene.sprites[i]];
    spriteOffset += sprite.size / 64;
  }

  return spriteOffset;
};

export const getSpriteSceneIndex = (spriteId, sprites, scene) => {
  const spriteIndex = getSpriteIndex(spriteId, sprites);
  return scene.sprites.indexOf(spriteIndex) + 1;
};

export const getVariableIndex = (variable, variables) => {
  const normalisedVariable = String(variable)
    .replace(/\$/g, "")
    .replace(/^0+([0-9])/, "$1");
  let variableIndex = variables.indexOf(normalisedVariable);
  if (variableIndex === -1) {
    variables.push(normalisedVariable);
    variableIndex = variables.length - 1;
  }
  return variableIndex;
};

export const compileConditional = (truePath, falsePath, options) => {
  const { output, compileEvents } = options;

  const truePtrIndex = output.length;
  output.push("PTR_PLACEHOLDER1");
  output.push("PTR_PLACEHOLDER2");

  if (typeof falsePath === "function") {
    falsePath();
  } else if (falsePath) {
    compileEvents(falsePath);
  }

  output.push(cmd(JUMP));
  const endPtrIndex = output.length;
  output.push("PTR_PLACEHOLDER1");
  output.push("PTR_PLACEHOLDER2");

  const truePointer = output.length;
  output[truePtrIndex] = truePointer >> 8;
  output[truePtrIndex + 1] = truePointer & 0xff;

  if (typeof truePath === "function") {
    truePath();
  } else if (truePath) {
    compileEvents(truePath);
  }

  const endIfPointer = output.length;
  output[endPtrIndex] = endIfPointer >> 8;
  output[endPtrIndex + 1] = endIfPointer & 0xff;
};

export const pushToArray = (output, data) => {
  output.push(...data);
};
