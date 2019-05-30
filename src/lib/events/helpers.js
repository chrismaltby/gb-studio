import { commandIndex as cmd, JUMP } from "./scriptCommands";

class CompileEventsError extends Error {
  constructor(message, data) {
    super(message);
    this.data = data;
    this.name = "CompileEventsError";
  }
}

const VARIABLE_NOT_FOUND = "VARIABLE_NOT_FOUND";

export const getActorIndex = (actorId, scene) => {
  return scene.actors.findIndex(a => a.id === actorId) + 1;
};

export const getActor = (actorId, scene) => {
  return scene.actors.find(a => a.id === actorId);
};

export const getMusicIndex = (musicId, music) => {
  const musicIndex = music.findIndex(track => track.id === musicId);
  return musicIndex;
};

export const getSpriteIndex = (spriteId, sprites) => {
  const spriteIndex = sprites.findIndex(sprite => sprite.id === spriteId);
  if (spriteIndex === -1) {
    return 0;
  }
  return spriteIndex;
};

export const getSprite = (spriteId, sprites) => {
  return sprites.find(sprite => sprite.id === spriteId);
};

export const getVariableIndex = (variable, variables) => {
  const variableIndex = variables.indexOf(String(variable));
  if (variableIndex === -1) {
    throw new CompileEventsError(VARIABLE_NOT_FOUND, { variable });
  }
  return variableIndex;
};

export const loadVectors = (args, output, variables) => {
  // const vectorX = getVariableIndex(args.vectorX, variables);
  // const vectorY = getVariableIndex(args.vectorY, variables);
  // output.push(CMD_LOOKUP.LOAD_VECTORS);
  // output.push(hi(vectorX));
  // output.push(lo(vectorX));
  // output.push(hi(vectorY));
  // output.push(lo(vectorY));
};

export const loadVectorsByIndex = (vectorX, vectorY, output) => {
  // output.push(CMD_LOOKUP.LOAD_VECTORS);
  // output.push(hi(vectorX));
  // output.push(lo(vectorX));
  // output.push(hi(vectorY));
  // output.push(lo(vectorY));
};

export const compileConditional = (truePath, falsePath, options) => {
  const { output, compile } = options;

  const truePtrIndex = output.length;
  output.push("PTR_PLACEHOLDER1");
  output.push("PTR_PLACEHOLDER2");

  if (typeof falsePath === "function") {
    falsePath();
  } else {
    compile(falsePath, {
      ...options,
      output,
      branch: true
    });
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
  } else {
    compile(truePath, {
      ...options,
      output,
      branch: true
    });
  }

  const endIfPointer = output.length;
  output[endPtrIndex] = endIfPointer >> 8;
  output[endPtrIndex + 1] = endIfPointer & 0xff;
};

export const pushToArray = (output, data) => {
  output.push(...data);
};
