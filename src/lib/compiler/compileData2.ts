export const BACKGROUND_TYPE = "const struct background_t";
export const SPRITESHEET_TYPE = "const struct spritesheet_t";
export const TILESET_TYPE = "const struct tileset_t";
export const TRIGGER_TYPE = "const struct trigger_t";
export const ACTOR_TYPE = "const struct actor_t";
export const SCENE_TYPE = "const struct scene_t";

export const sceneName = (scene: any, sceneIndex: number) =>
  scene.name || `Scene ${sceneIndex + 1}`;

export const actorName = (actor: any, actorIndex: number) =>
  actor.name || `Actor ${actorIndex + 1}`;

export const triggerName = (trigger: any, triggerIndex: number) =>
  trigger.name || `Trigger ${triggerIndex + 1}`;

export const toFarPtr = (ref: string): string => {
  return `TO_FAR_PTR(${ref})`;
};

export const includeGuard = (key: string, contents: string) => `#ifndef ${key}_H
#define ${key}_H

${contents}

#endif
`;

const toBankSymbol = (symbol: string): string => `__bank_${symbol}`;

const toBankSymbolDef = (symbol: string): string =>
  `extern const void ${toBankSymbol(symbol)}`;

const toBankSymbolInit = (symbol: string): string =>
  `const void __at(255) ${toBankSymbol(symbol)}`;

const backgroundSymbol = (backgroundIndex: number): string =>
  `background_${backgroundIndex}`;

const tilesetSymbol = (tilesetIndex: number): string =>
  `tileset_${tilesetIndex}`;

const spriteSheetSymbol = (spriteSheetIndex: number): string =>
  `spritesheet_${spriteSheetIndex}`;

const toDataHeader = (type: string, symbol: string, comment: string) =>
  includeGuard(
    symbol.toUpperCase(),
    `${comment}

#include "VM.h"

${toBankSymbolDef(symbol)};
extern ${type} ${symbol};`
  );

const sceneSymbol = (sceneIndex: number): string => `scene_${sceneIndex}`;

const sceneActorsSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_actors`;

const sceneTriggersSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_triggers`;

export const toStructData = <T extends {}>(
  object: T,
  indent: number = 0
): string => {
  const keys = (Object.keys(object) as unknown) as [keyof T];
  return keys
    .map((key) => {
      if (object[key] === undefined) {
        return "";
      }
      if (key === "__comment") {
        return `${" ".repeat(indent)}// ${object[key]}`;
      }
      if (Array.isArray(object[key])) {
        return `${" ".repeat(indent)}.${key} = {
${" ".repeat(indent * 2)}${((object[key] as unknown) as any[]).join(",")}
${" ".repeat(indent)}}`;
      }
      return `${" ".repeat(indent)}.${key} = ${object[key]}`;
    })
    .filter((line) => line.length > 0)
    .join(",\n");
};

export const toDataFile = <T extends {}>(
  type: string,
  symbol: string,
  comment: string,
  object: T,
  dependencies?: string[]
) => `#pragma bank 255
${comment ? "\n" + comment : ""}

#include "VM.h"
${
  dependencies
    ? dependencies.map((dependency) => `#include "${dependency}.h"`).join("\n")
    : ""
}

${toBankSymbolInit(symbol)};

${type} ${symbol} = {
${toStructData(object, 2)}
};
`;

export const toDataArrayFile = <T extends {}>(
  type: string,
  symbol: string,
  comment: string,
  array: [T],
  dependencies?: string[]
) => `#pragma bank 255
${comment ? "\n" + comment : ""}

#include "VM.h"${
  dependencies
    ? "\n" +
      dependencies.map((dependency) => `#include "${dependency}.h"`).join("\n")
    : ""
}

${toBankSymbolInit(symbol)};

${type} ${symbol}[] = {
${array
  .map(
    (object) => `  {
${toStructData(object, 4)}
  }`
  )
  .join(",\n")}
};
`;

export const dataArrayToC = (name: string, data: [number]): string => {
  return `#pragma bank 255
const void __at(255) __bank_${name};
  
const unsigned char ${name}[] = {
${data}
};`;
};

export const compileScene = (scene: any, sceneIndex: number) =>
  toDataFile(
    SCENE_TYPE,
    sceneSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}`,
    // Data
    {
      width: scene.width,
      height: scene.height,
      background: toFarPtr(backgroundSymbol(scene.backgroundIndex)),
      n_actors: scene.actors.length,
      n_triggers: scene.triggers.length,
      actors:
        scene.actors.length > 0
          ? toFarPtr(sceneActorsSymbol(sceneIndex))
          : undefined,
      triggers:
        scene.triggers.length > 0
          ? toFarPtr(sceneTriggersSymbol(sceneIndex))
          : undefined,
    },
    // Dependencies
    ([] as string[]).concat(
      backgroundSymbol(scene.backgroundIndex),
      scene.actors.length ? sceneActorsSymbol(sceneIndex) : [],
      scene.triggers.length > 0 ? sceneTriggersSymbol(sceneIndex) : []
    )
  );

export const compileSceneHeader = (scene: any, sceneIndex: number) =>
  toDataHeader(
    SCENE_TYPE,
    sceneSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}`
  );

export const compileSceneActors = (scene: any, sceneIndex: number) =>
  toDataArrayFile(
    ACTOR_TYPE,
    sceneActorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Actors`,
    scene.actors.map((actor: any, actorIndex: number) => ({
      __comment: actorName(actor, actorIndex),
      x: actor.x,
      y: actor.y,
    }))
  );

export const compileSceneActorsHeader = (scene: any, sceneIndex: number) =>
  toDataHeader(
    ACTOR_TYPE,
    sceneActorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Actors`
  );

export const compileSceneTriggers = (scene: any, sceneIndex: number) =>
  toDataArrayFile(
    TRIGGER_TYPE,
    sceneTriggersSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Triggers`,
    scene.triggers.map((trigger: any, triggerIndex: number) => ({
      __comment: triggerName(trigger, triggerIndex),
      x: trigger.x,
      y: trigger.y,
      width: trigger.width,
      height: trigger.height,
    }))
  );

export const compileSceneTriggersHeader = (scene: any, sceneIndex: number) =>
  toDataHeader(
    TRIGGER_TYPE,
    sceneTriggersSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Triggers`
  );

export const compileTileset = (tileset: any, tilesetIndex: number) =>
  toDataFile(
    TILESET_TYPE,
    tilesetSymbol(tilesetIndex),
    `// Tileset: ${tilesetIndex}`,
    {
      n_tiles: Math.ceil(tileset.length / 16),
      tiles: tileset,
    }
  );

export const compileTilesetHeader = (tileset: any, tilesetIndex: number) =>
  toDataHeader(
    TILESET_TYPE,
    tilesetSymbol(tilesetIndex),
    `// Tileset: ${tilesetIndex}`
  );

export const compileSpriteSheet = (
  spriteSheet: any,
  spriteSheetIndex: number
) =>
  toDataFile(
    SPRITESHEET_TYPE,
    spriteSheetSymbol(spriteSheetIndex),
    `// SpriteSheet: ${spriteSheetIndex}`,
    {
      n_frames: spriteSheet.frames,
      frames: spriteSheet.data,
    }
  );

export const compileSpriteSheetHeader = (
  spriteSheet: any,
  spriteSheetIndex: number
) =>
  toDataHeader(
    SPRITESHEET_TYPE,
    spriteSheetSymbol(spriteSheetIndex),
    `// SpriteSheet: ${spriteSheetIndex}`
  );

export const compileBackground = (background: any, backgroundIndex: number) =>
  toDataFile(
    BACKGROUND_TYPE,
    backgroundSymbol(backgroundIndex),
    `// Background: ${backgroundIndex}`,
    {
      width: background.width,
      height: background.height,
      tileset: toFarPtr(tilesetSymbol(background.tilesetIndex)),
      tiles: background.data,
    },
    [tilesetSymbol(background.tilesetIndex)]
  );

export const compileBackgroundHeader = (
  background: any,
  backgroundIndex: number
) =>
  toDataHeader(
    BACKGROUND_TYPE,
    backgroundSymbol(backgroundIndex),
    `// Background: ${backgroundIndex}`
  );
