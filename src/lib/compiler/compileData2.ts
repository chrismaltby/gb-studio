export const sceneName = (scene: any, sceneIndex: number) =>
  scene.name || `Scene ${sceneIndex + 1}`;

export const actorName = (actor: any, actorIndex: number) =>
  actor.name || `Actor ${actorIndex + 1}`;

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
#include "background_${scene.backgroundIndex}.h"
${scene.actors.length > 0 ? `#include "scene_${sceneIndex}_actors.h"` : ""}
${scene.triggers.length > 0 ? `#include "scene_${sceneIndex}_triggers.h"` : ""}

const void __at(255) __bank_scene_${sceneIndex}; 

const struct scene_t scene_${sceneIndex} = {
    .width = ${scene.width}, .height = ${scene.height},
    .background = TO_FAR_PTR(background_${scene.backgroundIndex}),
    .n_actors = ${scene.actors.length},
    .n_triggers = ${scene.triggers.length},
    .actors = ${
      scene.actors.length > 0 ? `TO_FAR_PTR(scene_${sceneIndex}_actors)` : "0"
    },
    .triggers = ${
      scene.triggers.length > 0
        ? `TO_FAR_PTR(scene_${sceneIndex}_triggers)`
        : "0"
    }
};
`;
};

export const compileSceneHeader = (scene: any, sceneIndex: number) => {
  return `#ifndef SCENE_${sceneIndex}_H
#define SCENE_${sceneIndex}_H
  
// Scene: ${sceneName(scene, sceneIndex)}

#include "VM.h"

extern const void __bank_scene_${sceneIndex};
extern const scene_t scene_${sceneIndex};

#endif
`;
};

export const compileSceneActors = (scene: any, sceneIndex: number) => {
  return `#pragma bank 255

// Scene: ${sceneName(scene, sceneIndex)}
// Actors

#include "VM.h"

const void __at(255) __bank_scene_${sceneIndex}_actors;

const actor_t scene_${sceneIndex}_actors[] = {
  ${scene.actors
    .map(
      (actor: any, actorIndex: number) => `// ${actorName(actor, actorIndex)}
  {
    .x = ${actor.x}, .y = ${actor.y}
  }`
    )
    .join(",\n  ")}
};
`;
};

export const compileSceneActorsHeader = (scene: any, sceneIndex: number) => {
  return `#ifndef SCENE_${sceneIndex}_ACTORS_H
#define SCENE_${sceneIndex}_ACTORS_H
  
// Scene: ${sceneName(scene, sceneIndex)}
// Actors

#include "VM.h"

extern const void __bank_scene_${sceneIndex}_actors;
extern const actor_t scene_${sceneIndex}_actors[];

#endif
`;
};

export const compileSceneTriggers = (scene: any, sceneIndex: number) => {
  return `#pragma bank 255

// Scene: ${sceneName(scene, sceneIndex)}
// Triggers

#include "VM.h"

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

export const compileSceneTriggersHeader = (scene: any, sceneIndex: number) => {
  return `#ifndef SCENE_${sceneIndex}_TRIGGERS_H
#define SCENE_${sceneIndex}_TRIGGERS_H
  
// Scene: ${sceneName(scene, sceneIndex)}
// Triggers

#include "VM.h"

extern const void __bank_scene_${sceneIndex}_triggers;
extern const trigger_t scene_${sceneIndex}_triggers[];

#endif
`;
};

export const compileTileset = (tileset: any, tilesetIndex: number) => {
  return `#pragma bank 255

// Tileset: ${tilesetIndex}  

#include "VM.h"

const void __at(255) __bank_tileset_${tilesetIndex};

const struct tileset_t tileset_${tilesetIndex} = {
  .n_tiles = ${Math.ceil(tileset.length / 16)},
  .tiles = {
    ${tileset}
  }
};
`;
};

export const compileTilesetHeader = (tileset: any, tilesetIndex: number) => {
  return `#ifndef TILESET_${tilesetIndex}_H
#define TILESET_${tilesetIndex}_H
  
// Tileset: ${tilesetIndex}  

#include "VM.h"

extern const void __bank_tileset_${tilesetIndex};
const struct tileset_t tileset_${tilesetIndex};

#endif
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

const struct spritesheet_t spriteSheet_${spriteSheetIndex} = {
  .n_frames = ${spriteSheet.frames},
  .frames = {
    ${spriteSheet.data}
  }
};
`;
};

export const compileBackground = (background: any, backgroundIndex: number) => {
  return `#pragma bank 255

// Background: ${backgroundIndex}  

#include "VM.h"
#include "tileset_${background.tilesetIndex}.h"

const void __at(255) __bank_background_${backgroundIndex};

const struct background_t background_${backgroundIndex} = {
  .width = ${background.width}, .height = ${background.height},
  .tileset = TO_FAR_PTR(tileset_${background.tilesetIndex}),
  .tiles = {
    ${background.data}
  }
};
`;
};

export const compileBackgroundHeader = (
  background: any,
  backgroundIndex: number
) => {
  return `#ifndef BACKGROUND_${backgroundIndex}_H
#define BACKGROUND_${backgroundIndex}_H
  
// Background: ${backgroundIndex}  

#include "VM.h"

extern const void __bank_background_${backgroundIndex};
const struct background_t background_${backgroundIndex};

#endif
`;
};
