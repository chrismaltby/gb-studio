export const sceneName = (scene: any, sceneIndex: number) =>
  scene.name || `Scene ${sceneIndex + 1}`;

export const triggerName = (trigger: any, triggerIndex: number) =>
  trigger.name || `Trigger ${triggerIndex + 1}`;

export const dataArrayToC = (name: string, data: [number]): string => {
  return `#pragma bank 255
const void __at(255) __bank_${name};
  
const unsigned char ${name}[] = {
${data}
};`;
};

export const compileScene = (scene: any, sceneIndex: number) => {
  return `#pragma bank 255

// Scene: ${sceneName(scene, sceneIndex)}

#include "VM.h"
// #include "Test.h"
// #include "scene_${sceneIndex}_actors.h"
// #include "scene_${sceneIndex}_triggers.h"
const void __at(255) __bank_scene_${sceneIndex}; 
const struct scene_t scene_${sceneIndex} = {
    .width = ${scene.width}, .height = ${scene.height},
    .tiles = TO_FAR_PTR(Test),
    .n_actors = ${scene.actors.length},
    .n_triggers = ${scene.triggers.length},
    .actors = ${
      scene.actors.length > 0 ? `TO_FAR_PTR(scene_${sceneIndex}_actors` : "0"
    },
    .triggers = ${
      scene.triggers.length > 0
        ? `TO_FAR_PTR(scene_${sceneIndex}_triggers`
        : "0"
    })
};
`;
};

export const compileSceneActors = (scene: any, sceneIndex: number) => {
  return `#pragma bank 255

// Scene: ${sceneName(scene, sceneIndex)}
// Actors

const void __at(255) __bank_scene_${sceneIndex}_actors;

const actor_t scene_${sceneIndex}_actors[] = {

};
`;
};

export const compileSceneTriggers = (scene: any, sceneIndex: number) => {
  return `#pragma bank 255

// Scene: ${sceneName(scene, sceneIndex)}
// Triggers

#include "VM.h"
// #include "Test.h"

const void __at(255) __bank_scene_${sceneIndex}_triggers;

const trigger_t scene_${sceneIndex}_triggers[] = {
  ${scene.triggers
    .map(
      (trigger: any, triggerIndex: number) => `// ${triggerName(
        trigger,
        triggerIndex
      )}
  {
    .x = ${trigger.x}, .y = ${trigger.y},
    .width = ${trigger.width}, .height = ${trigger.height}
  }`
    )
    .join(",\n  ")}
};
`;
};

export const compileTileset = (tileset: any, tilesetIndex: number) => {
  return `#pragma bank 255

// Tileset: ${tilesetIndex}  

#include "VM.h"

const void __at(255) __bank_tileset_${tilesetIndex};

const struct tileset_t tileset_${tilesetIndex}[] = {
  .n_tiles = ${Math.ceil(tileset.length / 16)},
  tiles = ${tileset}
};
`;
};

export const compileSpritesheet = (
  spriteSheet: any,
  spriteSheetIndex: number
) => {
  return `#pragma bank 255

// Spritesheet: ${spriteSheet.name}  

#include "VM.h"

const void __at(255) __bank_spriteSheet_${spriteSheetIndex};

const struct spritesheet_t spriteSheet_${spriteSheetIndex}[] = {
  .n_frames = ${spriteSheet.frames},
  frames = ${spriteSheet.data}
};
`;
};
