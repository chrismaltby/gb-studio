import { Dictionary } from "@reduxjs/toolkit";
import { SPRITE_TYPE_STATIC } from "../../consts";
import {
  actorFramesPerDir,
  animSpeedDec,
  collisionGroupDec,
  dirDec,
  moveSpeedDec,
  spriteTypeDec,
} from "./helpers";

export const BACKGROUND_TYPE = "const struct background_t";
export const SPRITESHEET_TYPE = "const struct spritesheet_t";
export const TILESET_TYPE = "const struct tileset_t";
export const TRIGGER_TYPE = "const struct trigger_t";
export const ACTOR_TYPE = "const struct actor_t";
export const SCENE_TYPE = "const struct scene_t";
export const DATA_TYPE = "const unsigned char";
export const FARPTR_TYPE = "const far_ptr_t";

export const chunk = <T>(arr: T[], len?: number): T[][] => {
  if (!len) {
    return [arr];
  }

  const chunks: T[][] = [];
  const n = arr.length;
  let i = 0;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
};

export const toHex = (n: number) =>
  "0x" + n.toString(16).toUpperCase().padStart(2, "0");

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

export const spriteSheetSymbol = (spriteSheetIndex: number): string =>
  `spritesheet_${spriteSheetIndex}`;

export const paletteSymbol = (paletteIndex: number): string =>
  `palette_${paletteIndex}`;

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

const sceneSpritesSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_sprites`;

const sceneCollisionsSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_collisions`;

const sceneColorsSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_colors`;

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

export const toStructDataFile = <T extends {}>(
  type: string,
  symbol: string,
  comment: string,
  object: T,
  dependencies?: string[]
) => `#pragma bank 255
${comment ? "\n" + comment : ""}

#include "VM.h"${
  dependencies
    ? "\n" +
      dependencies
        .map((dependency) => `#include "data/${dependency}.h"`)
        .join("\n")
    : ""
}

${toBankSymbolInit(symbol)};

${type} ${symbol} = {
${toStructData(object, 2)}
};
`;

export const toStructArrayDataFile = <T extends {}>(
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
      dependencies
        .map((dependency) => `#include "data/${dependency}.h"`)
        .join("\n")
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

export const toArrayDataFile = (
  type: string,
  symbol: string,
  comment: string,
  array: (string | number)[],
  perLine: number,
  dependencies?: string[]
) => `#pragma bank 255
${comment ? "\n" + comment : ""}

#include "VM.h"${
  dependencies
    ? "\n" +
      dependencies
        .map((dependency) => `#include "data/${dependency}.h"`)
        .join("\n")
    : ""
}

${toBankSymbolInit(symbol)};

${type} ${symbol}[] = {
  ${chunk(array, perLine)
    .map((r) => r.join(", "))
    .join(",\n  ")}
};
`;

export const dataArrayToC = (name: string, data: [number]): string => {
  return `#pragma bank 255
const void __at(255) __bank_${name};
  
const unsigned char ${name}[] = {
${data}
};`;
};

export const compileScene = (
  scene: any,
  sceneIndex: number,
  { bgPalette, actorsPalette }: { bgPalette: number; actorsPalette: number }
) =>
  toStructDataFile(
    SCENE_TYPE,
    sceneSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}`,
    // Data
    {
      width: scene.width,
      height: scene.height,
      type: scene.type ? parseInt(scene.type, 10) : 0,
      background: toFarPtr(backgroundSymbol(scene.backgroundIndex)),
      collisions: toFarPtr(sceneCollisionsSymbol(sceneIndex)),
      colors: toFarPtr(sceneColorsSymbol(sceneIndex)),
      palette: toFarPtr(paletteSymbol(bgPalette)),
      sprite_palette: toFarPtr(paletteSymbol(actorsPalette)),
      n_actors: scene.actors.length,
      n_triggers: scene.triggers.length,
      n_sprites: scene.sprites.length,
      actors:
        scene.actors.length > 0
          ? toFarPtr(sceneActorsSymbol(sceneIndex))
          : undefined,
      triggers:
        scene.triggers.length > 0
          ? toFarPtr(sceneTriggersSymbol(sceneIndex))
          : undefined,
      sprites:
        scene.sprites.length > 0
          ? toFarPtr(sceneSpritesSymbol(sceneIndex))
          : undefined,
    },
    // Dependencies
    ([] as string[]).concat(
      backgroundSymbol(scene.backgroundIndex),
      sceneCollisionsSymbol(sceneIndex),
      sceneColorsSymbol(sceneIndex),
      paletteSymbol(bgPalette),
      paletteSymbol(actorsPalette),
      scene.actors.length ? sceneActorsSymbol(sceneIndex) : [],
      scene.triggers.length > 0 ? sceneTriggersSymbol(sceneIndex) : [],
      scene.sprites.length > 0 ? sceneSpritesSymbol(sceneIndex) : []
    )
  );

export const compileSceneHeader = (scene: any, sceneIndex: number) =>
  toDataHeader(
    SCENE_TYPE,
    sceneSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}`
  );

export const compileSceneActors = (
  scene: any,
  sceneIndex: number,
  sprites: any[],
  actorPaletteIndexes: any
) => {
  const mapSpritesLookup: Dictionary<any> = {};
  let mapSpritesIndex = 6;

  const getSpriteOffset = (id: string) => {
    if (mapSpritesLookup[id]) {
      return mapSpritesLookup[id];
    }
    const lookup = mapSpritesIndex;
    mapSpritesLookup[id] = lookup;
    const sprite = sprites.find((s) => s.id === id);

    if (!sprite) {
      return 0;
    }

    // console.log(sprites);
    mapSpritesIndex += sprite.size / 64;
    return lookup;
  };

  return toStructArrayDataFile(
    ACTOR_TYPE,
    sceneActorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Actors1`,
    scene.actors.map((actor: any, actorIndex: number) => {
      const sprite = sprites.find((s) => s.id === actor.spriteSheetId);
      if (!sprite) return [];
      const spriteFrames = sprite.frames;
      const actorFrames = actorFramesPerDir(actor.spriteType, spriteFrames);
      const initialFrame =
        actor.spriteType === SPRITE_TYPE_STATIC ? actor.frame % actorFrames : 0;
      const collisionGroup = collisionGroupDec(actor.collisionGroup);
      return {
        __comment: actorName(actor, actorIndex),
        x: actor.x,
        y: actor.y,
        sprite: getSpriteOffset(actor.spriteSheetId),
        sprite_type: spriteTypeDec(actor.spriteType, spriteFrames),
        palette: actorPaletteIndexes[actor.id] || 0,
        n_frames: actorFrames,
        initial_frame: initialFrame || 0,
        animate: actor.animate ? "TRUE" : "FALSE",
        direction: dirDec(actor.direction),
        move_speed: moveSpeedDec(actor.moveSpeed),
        anim_speed: animSpeedDec(actor.animSpeed),
        pinned: actor.isPinned ? "TRUE" : "FALSE",
        collision_group: collisionGroup,
      };
    })
  );
};

export const compileSceneActorsHeader = (scene: any, sceneIndex: number) =>
  toDataHeader(
    ACTOR_TYPE,
    sceneActorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Actors`
  );

export const compileSceneTriggers = (scene: any, sceneIndex: number) =>
  toStructArrayDataFile(
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

export const compileSceneSprites = (scene: any, sceneIndex: number) =>
  toArrayDataFile(
    FARPTR_TYPE,
    sceneSpritesSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Sprites`,
    scene.sprites.map((spriteIndex: number) =>
      toFarPtr(spriteSheetSymbol(spriteIndex))
    ),
    1,
    scene.sprites.map((spriteIndex: number) => spriteSheetSymbol(spriteIndex))
  );

export const compileSceneSpritesHeader = (scene: any, sceneIndex: number) =>
  toDataHeader(
    FARPTR_TYPE,
    sceneSpritesSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Sprites`
  );

export const compileSceneCollisions = (
  scene: any,
  sceneIndex: number,
  collisions: number[]
) =>
  toArrayDataFile(
    DATA_TYPE,
    sceneCollisionsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Collisions`,
    collisions.map(toHex),
    scene.width
  );

export const compileSceneCollisionsHeader = (scene: any, sceneIndex: number) =>
  toDataHeader(
    DATA_TYPE,
    sceneCollisionsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Collisions`
  );

export const compileSceneColors = (
  scene: any,
  sceneIndex: number,
  colors: number[]
) =>
  toArrayDataFile(
    DATA_TYPE,
    sceneColorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Colors`,
    colors.map(toHex),
    scene.width
  );

export const compileSceneColorsHeader = (scene: any, sceneIndex: number) =>
  toDataHeader(
    DATA_TYPE,
    sceneColorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Colors`
  );

export const compileTileset = (tileset: any, tilesetIndex: number) =>
  toStructDataFile(
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
  toStructDataFile(
    SPRITESHEET_TYPE,
    spriteSheetSymbol(spriteSheetIndex),
    `// SpriteSheet: ${spriteSheet.name}`,
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
  toStructDataFile(
    BACKGROUND_TYPE,
    backgroundSymbol(backgroundIndex),
    `// Background: ${background.name}`,
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

export const compilePalette = (palette: any, paletteIndex: number) =>
  toArrayDataFile(
    DATA_TYPE,
    paletteSymbol(paletteIndex),
    `// Palette: ${paletteIndex}`,
    palette,
    8
  );

export const compilePaletteHeader = (palette: any, paletteIndex: number) =>
  toDataHeader(
    DATA_TYPE,
    paletteSymbol(paletteIndex),
    `// Palette: ${paletteIndex}\n`
  );
