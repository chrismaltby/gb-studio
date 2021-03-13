import { Dictionary } from "@reduxjs/toolkit";
import flatten from "lodash/flatten";
import { SPRITE_TYPE_STATIC } from "../../consts";
import { SceneParallaxLayer } from "../../store/features/entities/entitiesTypes";
import { FontData } from "../fonts/fontData";
import { PrecompiledSpriteSheetData } from "./compileSprites";
import {
  actorFramesPerDir,
  animSpeedDec,
  collisionGroupDec,
  dirDec,
  moveSpeedDec,
  spriteTypeDec,
} from "./helpers";

interface PrecompiledBackground {
  name: string;
  width: number;
  height: number;
  tilesetIndex: number;
  data: Uint8Array;
}

export const BACKGROUND_TYPE = "const struct background_t";
export const SPRITESHEET_TYPE = "const struct spritesheet_t";
export const TILESET_TYPE = "const struct tileset_t";
export const TRIGGER_TYPE = "const struct trigger_t";
export const ACTOR_TYPE = "const struct actor_t";
export const SCENE_TYPE = "const struct scene_t";
export const DATA_TYPE = "const unsigned char";
export const FARPTR_TYPE = "const far_ptr_t";
export const FONT_FLAG_RECODE_7BIT = "RECODE_7BIT";
export const FONT_FLAG_FONT_VWF = "FONT_VWF";
export const FONT_FLAG_FONT_VWF_1BIT = "FONT_VWF_1BIT";

const INDENT_SPACES = 4;

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
  return `TO_FAR_PTR_T(${ref})`;
};

export const toASMCollisionGroup = (group: string) => {
  if (group === "player") {
    return "COLLISION_GROUP_PLAYER";
  }
  if (group === "1") {
    return "COLLISION_GROUP_1";
  }
  if (group === "2") {
    return "COLLISION_GROUP_2";
  }
  if (group === "3") {
    return "COLLISION_GROUP_3";
  }
  return "COLLISION_GROUP_NONE";
};

export const maybeScriptFarPtr = (scriptSymbol: string) =>
  scriptSymbol ? toFarPtr(scriptSymbol) : undefined;

export const maybeScriptDependency = (scriptSymbol: string) =>
  scriptSymbol ? scriptSymbol : [];

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

export const fontSymbol = (fontIndex: number): string => `font_${fontIndex}`;

const toFlags = (flags: string[]): string =>
  flags.length > 0 ? flags.join("| ") : "0";

const toDataHeader = (type: string, symbol: string, comment: string) =>
  includeGuard(
    symbol.toUpperCase(),
    `${comment}

#include "gbs_types.h"

${toBankSymbolDef(symbol)};
extern ${type} ${symbol};`
  );

const toArrayDataHeader = (type: string, symbol: string, comment: string) =>
  includeGuard(
    symbol.toUpperCase(),
    `${comment}

#include "gbs_types.h"

${toBankSymbolDef(symbol)};
extern ${type} ${symbol}[];`
  );

export const sceneSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}`;

export const sceneActorsSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_actors`;

export const sceneTriggersSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_triggers`;

export const sceneSpritesSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_sprites`;

export const sceneCollisionsSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_collisions`;

export const sceneColorsSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_colors`;

export const scriptSymbol = (sceneIndex: number): string =>
  `script_${sceneIndex}`;

export const toStructData = <T extends {}>(
  object: T,
  indent: number = 0,
  perLine: number = 16
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
${chunk((object[key] as unknown) as any[], perLine)
  .map(
    (r) =>
      " ".repeat(indent * 2) +
      r
        .map((v) => {
          if (v instanceof Object) {
            return `{\n${toStructData(
              v,
              indent + 2 * INDENT_SPACES,
              perLine
            )}\n${" ".repeat(indent * 2)}}`;
          }
          return v;
        })
        .join(
          r[0] && r[0] instanceof Object ? `,\n${" ".repeat(indent * 2)}` : ", "
        )
  )
  .join(",\n")}
${" ".repeat(indent)}}`;
      }
      if (object[key] instanceof Object) {
        return `${" ".repeat(indent)}.${key} = {
${toStructData(object[key], indent + INDENT_SPACES, perLine)}
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

#include "gbs_types.h"${
  dependencies
    ? "\n" +
      dependencies
        .map((dependency) => `#include "data/${dependency}.h"`)
        .join("\n")
    : ""
}

${toBankSymbolInit(symbol)};

${type} ${symbol} = {
${toStructData(object, INDENT_SPACES)}
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

#include "gbs_types.h"${
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
    (object) => `${" ".repeat(INDENT_SPACES)}{
${toStructData(object, 2 * INDENT_SPACES)}
${" ".repeat(INDENT_SPACES)}}`
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

#include "gbs_types.h"${
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
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
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

export const compileParallax = (
  parallax: SceneParallaxLayer[] | undefined
): string[] | undefined => {
  if (parallax) {
    let row = 0;
    return parallax.map((layer, layerIndex) => {
      if (layerIndex === parallax.length - 1) {
        return `PARALLAX_STEP(${row}, 0, ${layer.speed})`;
      }
      const str = `PARALLAX_STEP(${row}, ${row + layer.height}, ${
        layer.speed
      })`;
      row += layer.height;
      return str;
    });
  }
  return undefined;
};

export const compileScene = (
  scene: any,
  sceneIndex: number,
  {
    color,
    bgPalette,
    actorsPalette,
    eventPtrs,
  }: {
    color: boolean;
    bgPalette: number;
    actorsPalette: number;
    eventPtrs: any;
  }
) =>
  toStructDataFile(
    SCENE_TYPE,
    sceneSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}`,
    // Data
    {
      width: scene.width,
      height: scene.height,
      type: `SCENE_TYPE_${scene.type}`,
      background: toFarPtr(backgroundSymbol(scene.backgroundIndex)),
      collisions: toFarPtr(sceneCollisionsSymbol(sceneIndex)),
      colors: color ? toFarPtr(sceneColorsSymbol(sceneIndex)) : undefined,
      palette: color ? toFarPtr(paletteSymbol(bgPalette)) : undefined,
      parallax_rows: compileParallax(scene.parallax),
      sprite_palette: color
        ? toFarPtr(paletteSymbol(actorsPalette))
        : undefined,
      player_sprite: toFarPtr(spriteSheetSymbol(0)),
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
      script_init: maybeScriptFarPtr(eventPtrs[sceneIndex].start),
      script_p_hit1: maybeScriptFarPtr(eventPtrs[sceneIndex].playerHit1),
      script_p_hit2: maybeScriptFarPtr(eventPtrs[sceneIndex].playerHit2),
      script_p_hit3: maybeScriptFarPtr(eventPtrs[sceneIndex].playerHit3),
    },
    // Dependencies
    ([] as string[]).concat(
      backgroundSymbol(scene.backgroundIndex),
      sceneCollisionsSymbol(sceneIndex),
      color ? sceneColorsSymbol(sceneIndex) : [],
      color ? paletteSymbol(bgPalette) : [],
      color ? paletteSymbol(actorsPalette) : [],
      scene.actors.length ? sceneActorsSymbol(sceneIndex) : [],
      scene.triggers.length > 0 ? sceneTriggersSymbol(sceneIndex) : [],
      scene.sprites.length > 0 ? sceneSpritesSymbol(sceneIndex) : [],
      spriteSheetSymbol(0),
      maybeScriptDependency(eventPtrs[sceneIndex].start),
      maybeScriptDependency(eventPtrs[sceneIndex].playerHit1),
      maybeScriptDependency(eventPtrs[sceneIndex].playerHit2),
      maybeScriptDependency(eventPtrs[sceneIndex].playerHit3)
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
  actorPaletteIndexes: any,
  { eventPtrs }: { eventPtrs: any }
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

  const events = eventPtrs[sceneIndex];

  return toStructArrayDataFile(
    ACTOR_TYPE,
    sceneActorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Actors`,
    scene.actors.map((actor: any, actorIndex: number) => {
      const sprite = sprites.find((s) => s.id === actor.spriteSheetId);
      const spriteIndex = sprites.findIndex(
        (s) => s.id === actor.spriteSheetId
      );
      if (!sprite) return [];
      const spriteFrames = sprite.frames;
      const spriteOffset = getSpriteOffset(actor.spriteSheetId);
      const actorFrames = actorFramesPerDir(actor.spriteType, spriteFrames);
      const initialFrame =
        actor.spriteType === SPRITE_TYPE_STATIC ? actor.frame % actorFrames : 0;
      return {
        __comment: actorName(actor, actorIndex),
        pos: {
          x: `${actor.x * 8} * 16`,
          y: `${(actor.y + 1) * 8} * 16`,
        },
        bounds: {
          left: 2,
          right: 16,
          top: -16,
          bottom: 0,
        },
        dir: "DIR_DOWN",
        sprite: toFarPtr(spriteSheetSymbol(spriteIndex)),
        palette: actorPaletteIndexes[actor.id] || 0,
        move_speed: Math.round(actor.moveSpeed * 16),
        anim_tick: actor.animSpeed,
        pinned: actor.isPinned ? "TRUE" : "FALSE",
        collision_group: toASMCollisionGroup(actor.collisionGroup),
        collision_enabled: "TRUE",
        script: maybeScriptFarPtr(events.actors[actorIndex]),
        script_update: maybeScriptFarPtr(events.actorsMovement[actorIndex]),
        script_hit1: maybeScriptFarPtr(events.actorsHit1[actorIndex]),
        script_hit2: maybeScriptFarPtr(events.actorsHit2[actorIndex]),
        script_hit3: maybeScriptFarPtr(events.actorsHit3[actorIndex]),
      };
    }),
    // Dependencies
    flatten(
      scene.actors.map((actor: any, actorIndex: number) => {
        const sprite = sprites.find((s) => s.id === actor.spriteSheetId);
        const spriteIndex = sprites.findIndex(
          (s) => s.id === actor.spriteSheetId
        );
        return ([] as string[]).concat(
          spriteSheetSymbol(spriteIndex),
          maybeScriptDependency(events.actors[actorIndex]),
          maybeScriptDependency(events.actorsMovement[actorIndex]),
          maybeScriptDependency(events.actorsHit1[actorIndex]),
          maybeScriptDependency(events.actorsHit2[actorIndex]),
          maybeScriptDependency(events.actorsHit3[actorIndex])
        );
      })
    )
  );
};

export const compileSceneActorsHeader = (scene: any, sceneIndex: number) =>
  toArrayDataHeader(
    ACTOR_TYPE,
    sceneActorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Actors`
  );

export const compileSceneTriggers = (
  scene: any,
  sceneIndex: number,
  { eventPtrs }: { eventPtrs: any }
) =>
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
      script: maybeScriptFarPtr(eventPtrs[sceneIndex].triggers[triggerIndex]),
    })),
    // Dependencies
    flatten(
      scene.triggers.map((trigger: any, triggerIndex: number) => {
        return ([] as string[]).concat(
          maybeScriptDependency(eventPtrs[sceneIndex].triggers[triggerIndex])
        );
      })
    )
  );

export const compileSceneTriggersHeader = (scene: any, sceneIndex: number) =>
  toArrayDataHeader(
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
  toArrayDataHeader(
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
  toArrayDataHeader(
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
  toArrayDataHeader(
    DATA_TYPE,
    sceneColorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Colors`
  );

export const compileTileset = (tileset: Uint8Array, tilesetIndex: number) =>
  toStructDataFile(
    TILESET_TYPE,
    tilesetSymbol(tilesetIndex),
    `// Tileset: ${tilesetIndex}`,
    {
      n_tiles: Math.ceil(tileset.length / 16),
      tiles: Array.from(tileset).map(toHex),
    }
  );

export const compileTilesetHeader = (
  tileset: Uint8Array,
  tilesetIndex: number
) =>
  toDataHeader(
    TILESET_TYPE,
    tilesetSymbol(tilesetIndex),
    `// Tileset: ${tilesetIndex}`
  );

export const compileSpriteSheet = (
  spriteSheet: PrecompiledSpriteSheetData,
  spriteSheetIndex: number
) =>
  `#pragma bank 255
// SpriteSheet: ${spriteSheet.name}
  
#include "gbs_types.h"

${toBankSymbolInit(spriteSheetSymbol(spriteSheetIndex))};

${spriteSheet.metasprites
  .map((metasprite, metaspriteIndex) => {
    return `const metasprite_t ${spriteSheetSymbol(
      spriteSheetIndex
    )}_metasprite_${metaspriteIndex}[]  = {
  ${metasprite
    .map((tile) => `{ ${tile.y}, ${tile.x}, ${tile.tile}, ${tile.props} }`)
    .join(", ")}${metasprite.length > 0 ? ",\n" : ""}{metasprite_end}
};`;
  })
  .join("\n\n")}

const metasprite_t * const ${spriteSheetSymbol(
    spriteSheetIndex
  )}_metasprites[] = {
${spriteSheet.metaspritesOrder
  .map(
    (index) => `    ${spriteSheetSymbol(spriteSheetIndex)}_metasprite_${index}`
  )
  .join(",\n")}
};

${SPRITESHEET_TYPE} ${spriteSheetSymbol(spriteSheetIndex)} = {
${toStructData(
  {
    n_tiles: spriteSheet.tiles.length,
    n_metasprites: spriteSheet.metaspritesOrder.length,
    metasprites: `${spriteSheetSymbol(spriteSheetIndex)}_metasprites`,
    animations: spriteSheet.animationOffsets,
    tiles: spriteSheet.data.map(toHex),
  },

  INDENT_SPACES
)}
};
`;

export const compileSpriteSheetHeader = (
  _spriteSheet: PrecompiledSpriteSheetData,
  spriteSheetIndex: number
) =>
  toDataHeader(
    SPRITESHEET_TYPE,
    spriteSheetSymbol(spriteSheetIndex),
    `// SpriteSheet: ${spriteSheetIndex}`
  );

export const compileBackground = (
  background: PrecompiledBackground,
  backgroundIndex: number
) =>
  toStructDataFile(
    BACKGROUND_TYPE,
    backgroundSymbol(backgroundIndex),
    `// Background: ${background.name}`,
    {
      width: background.width,
      height: background.height,
      tileset: toFarPtr(tilesetSymbol(background.tilesetIndex)),
      tiles: Array.from(background.data).map(toHex),
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
    palette.map(toHex),
    8
  );

export const compilePaletteHeader = (palette: any, paletteIndex: number) =>
  toDataHeader(
    DATA_TYPE,
    paletteSymbol(paletteIndex),
    `// Palette: ${paletteIndex}`
  );

export const compileFont = (
  font: FontData,
  fontIndex: number
) => `#pragma bank 255
// Font: ${font.name}
  
#include "gbs_types.h"

static const UBYTE ${fontSymbol(fontIndex)}_table[] = {
${chunk(Array.from(font.table.map(toHex)), 16)
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
  .join(",\n")}
};

static const UBYTE ${fontSymbol(fontIndex)}_widths[] = {
${chunk(Array.from(font.widths), 16)
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
  .join(",\n")}
};

static const UBYTE ${fontSymbol(fontIndex)}_bitmaps[] = {
${chunk(Array.from(Array.from(font.data).map(toHex)), 16)
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
  .join(",\n")}
};

${toBankSymbolInit(fontSymbol(fontIndex))};
const font_desc_t ${fontSymbol(fontIndex)} = {
  ${toFlags([
    ...(font.table.length <= 128 ? [FONT_FLAG_RECODE_7BIT] : []),
    ...(font.isVariableWidth ? [FONT_FLAG_FONT_VWF] : []),
    ...(font.is1Bit && font.isVariableWidth ? [FONT_FLAG_FONT_VWF_1BIT] : []),
  ])}, 
  ${fontSymbol(fontIndex)}_table,
  ${fontSymbol(fontIndex)}_widths,
  ${fontSymbol(fontIndex)}_bitmaps
};
`;

export const compileFontHeader = (data: FontData, fontIndex: number) =>
  toArrayDataHeader(DATA_TYPE, fontSymbol(fontIndex), `// Font`);

export const compileFrameImage = (data: Uint8Array) =>
  toArrayDataFile(
    DATA_TYPE,
    "frame_image",
    `// Frame`,
    Array.from(data).map(toHex),
    16
  );

export const compileFrameImageHeader = (data: Uint8Array) =>
  toArrayDataHeader(DATA_TYPE, "frame_image", `// Frame`);

export const compileCursorImage = (data: Uint8Array) =>
  toArrayDataFile(
    DATA_TYPE,
    "cursor_image",
    `// Cursor`,
    Array.from(data).map(toHex),
    16
  );

export const compileCursorImageHeader = (data: Uint8Array) =>
  toArrayDataHeader(DATA_TYPE, "cursor_image", `// Cursor`);

export const compileScriptHeader = (scriptName: string) =>
  toArrayDataHeader(DATA_TYPE, scriptName, `// Script ${scriptName}`);

export const compileGameGlobalsInclude = (
  variableAliasLookup: Dictionary<string>
) =>
  (Object.values(variableAliasLookup) as string[])
    .map((string, stringIndex) => {
      return `${string} = ${stringIndex}\n`;
    })
    .join("");
