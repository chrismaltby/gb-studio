/* eslint-disable camelcase */
import { Dictionary } from "@reduxjs/toolkit";
import flatten from "lodash/flatten";
import { SCREEN_WIDTH } from "../../consts";
import {
  Actor,
  SceneParallaxLayer,
  Trigger,
} from "store/features/entities/entitiesTypes";
import { FontData } from "../fonts/fontData";
import { decHex32Val, hexDec, wrap8Bit } from "../helpers/8bit";
import { PrecompiledSpriteSheetData } from "./compileSprites";
import { dirEnum } from "./helpers";

interface PrecompiledBackground {
  name: string;
  width: number;
  height: number;
  data: Uint8Array;
  tilesetIndex: number;
  tilemapIndex: number;
  tilemapAttrIndex: number;
}

interface PrecompiledProjectile {
  spriteSheetId: string;
  spriteStateId: string;
  speed: number;
  animSpeed: number;
  lifeTime: number;
  initialOffset: number;
  collisionGroup: string;
  collisionMask: string[];
}

interface AvatarData {
  data: Uint8Array;
}

interface EmoteData {
  data: Uint8Array;
}

interface Entity {
  name: string;
}

interface PrecompiledScene {
  id: string;
  name: string;
  width: number;
  height: number;
  type: string;
  backgroundIndex: number;
  playerSpriteIndex: number;
  parallax: Array<{ height: number; speed: number }>;
  actorsExclusiveLookup: Dictionary<number>;
  actors: Actor[];
  triggers: Trigger[];
  projectiles: PrecompiledProjectile[];
  sprites: number[];
}

interface PrecompiledSceneEventPtrs {
  start: string | null;
  playerHit1: string | null;
  actors: Array<string | null>;
  actorsMovement: Array<string | null>;
  actorsHit1: Array<string | null>;
  triggers: Array<string | null>;
  triggersLeave: Array<string | null>;
}

interface PrecompiledPalette {
  dmg: [string, string, string, string][];
  colors: [string, string, string, string][];
}

export const BACKGROUND_TYPE = "const struct background_t";
export const SPRITESHEET_TYPE = "const struct spritesheet_t";
export const TILESET_TYPE = "const struct tileset_t";
export const TRIGGER_TYPE = "const struct trigger_t";
export const ACTOR_TYPE = "const struct actor_t";
export const SCENE_TYPE = "const struct scene_t";
export const PROJECTILE_TYPE = "const struct projectile_def_t";
export const PALETTE_TYPE = "const struct palette_t";
export const DATA_TYPE = "const unsigned char";
export const FARPTR_TYPE = "const far_ptr_t";
export const FONT_FLAG_FONT_RECODE = "FONT_RECODE";
export const FONT_FLAG_FONT_RECODE_SIZE_7BIT = "FONT_RECODE_SIZE_7BIT";
export const FONT_FLAG_FONT_VWF = "FONT_VWF";
export const FONT_FLAG_FONT_VWF_1BIT = "FONT_VWF_1BIT";

const INDENT_SPACES = 4;

export function filterNull<T>(ts: (T | null)[]): T[] {
  return ts.filter((t: T | null): t is T => !!t);
}

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

export const sceneName = (scene: Entity, sceneIndex: number) =>
  scene.name || `Scene ${sceneIndex + 1}`;

export const actorName = (actor: Entity, actorIndex: number) =>
  actor.name || `Actor ${actorIndex + 1}`;

export const triggerName = (trigger: Entity, triggerIndex: number) =>
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

export const toASMCollisionMask = (mask: string[]) => {
  const flags = mask
    .map((group: string) => {
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
      return "";
    })
    .filter((group) => group !== "")
    .sort();

  return flags.length > 0 ? flags.join(" | ") : 0;
};

export const maybeScriptFarPtr = (scriptSymbol: string | null) =>
  scriptSymbol ? toFarPtr(scriptSymbol) : undefined;

export const maybeScriptDependency = (scriptSymbol: string | null) =>
  scriptSymbol ? scriptSymbol : [];

export const toASMTriggerScriptFlags = (trigger: Trigger) => {
  const flags = [];

  if (trigger.script.length > 0) flags.push("TRIGGER_HAS_ENTER_SCRIPT");
  if (trigger.leaveScript.length > 0) flags.push("TRIGGER_HAS_LEAVE_SCRIPT");

  return flags.length > 0 ? flags.join(" | ") : 0;
};

export const includeGuard = (key: string, contents: string) => `#ifndef ${key}_H
#define ${key}_H

${contents}

#endif
`;

const bankRefExtern = (symbol: string): string => `BANKREF_EXTERN(${symbol})`;

const bankRef = (symbol: string): string => `BANKREF(${symbol})`;

const backgroundSymbol = (backgroundIndex: number): string =>
  `background_${backgroundIndex}`;

const tilemapSymbol = (tilemapIndex: number): string =>
  `tilemap_${tilemapIndex}`;

const tilemapAttrSymbol = (tilemapAttrIndex: number): string =>
  `tilemap_attr_${tilemapAttrIndex}`;

const tilesetSymbol = (tilesetIndex: number): string =>
  `tileset_${tilesetIndex}`;

export const spriteSheetSymbol = (spriteSheetIndex: number): string =>
  `spritesheet_${spriteSheetIndex}`;

export const paletteSymbol = (paletteIndex: number): string =>
  `palette_${paletteIndex}`;

export const fontSymbol = (fontIndex: number): string => `font_${fontIndex}`;

export const avatarFontSymbol = (avatarFontIndex: number): string =>
  `avatar_font_${avatarFontIndex}`;

export const emoteSymbol = (emoteIndex: number): string =>
  `emote_${emoteIndex}`;

const toFlags = (flags: string[]): string =>
  flags.length > 0 ? flags.join(" | ") : "0";

const toDataHeader = (type: string, symbol: string, comment: string) =>
  includeGuard(
    symbol.toUpperCase(),
    `${comment}

#include "gbs_types.h"

${bankRefExtern(symbol)}
extern ${type} ${symbol};`
  );

const toArrayDataHeader = (type: string, symbol: string, comment: string) =>
  includeGuard(
    symbol.toUpperCase(),
    `${comment}

#include "gbs_types.h"

${bankRefExtern(symbol)}
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

export const sceneProjectilesSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_projectiles`;

export const sceneCollisionsSymbol = (sceneIndex: number): string =>
  `scene_${sceneIndex}_collisions`;

export const scriptSymbol = (sceneIndex: number): string =>
  `script_${sceneIndex}`;

export const toStructData = <T extends Record<string, unknown>>(
  object: T,
  indent = 0,
  perLine = 16
): string => {
  const keys = Object.keys(object) as unknown as [keyof T];
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
${chunk(object[key] as unknown as Record<string, unknown>[], perLine)
  .map(
    (r) =>
      " ".repeat(indent + INDENT_SPACES) +
      r
        .map((v) => {
          if (v instanceof Object) {
            return `{\n${toStructData(
              v,
              indent + 2 * INDENT_SPACES,
              perLine
            )}\n${" ".repeat(indent + INDENT_SPACES)}}`;
          }
          return v;
        })
        .join(
          r[0] && r[0] instanceof Object
            ? `,\n${" ".repeat(indent + INDENT_SPACES)}`
            : ", "
        )
  )
  .join(",\n")}
${" ".repeat(indent)}}`;
      }
      if (object[key] instanceof Object) {
        return `${" ".repeat(indent)}.${key} = {
${toStructData(
  object[key] as Record<string, unknown>,
  indent + INDENT_SPACES,
  perLine
)}
${" ".repeat(indent)}}`;
      }
      return `${" ".repeat(indent)}.${key} = ${object[key]}`;
    })
    .filter((line) => line.length > 0)
    .join(",\n");
};

export const toStructDataFile = <T extends Record<string, unknown>>(
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

${bankRef(symbol)}

${type} ${symbol} = {
${toStructData(object, INDENT_SPACES)}
};
`;

export const toStructArrayDataFile = <T extends Record<string, unknown>>(
  type: string,
  symbol: string,
  comment: string,
  array: Array<T>,
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

${bankRef(symbol)}

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

${bankRef(symbol)}

${type} ${symbol}[] = {
${chunk(array, perLine)
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
  .join(",\n")}
};
`;

export const dataArrayToC = (name: string, data: [number]): string => {
  return `#pragma bank 255
${bankRef(name)}
  
const unsigned char ${name}[] = {
${data}
};`;
};

export const compileParallax = (
  parallax: SceneParallaxLayer[] | undefined
): string[] | undefined => {
  if (parallax) {
    let row = 0;
    const layers = parallax.map((layer, layerIndex) => {
      // For num layers = 1 or 2 extend final layer to fill screen
      // if not set to normal scroll speed
      if (
        parallax.length < 3 &&
        layerIndex === parallax.length - 1 &&
        layer.speed !== 0
      ) {
        return `PARALLAX_STEP(${row}, 18, ${layer.speed})`;
      }
      if (layerIndex === parallax.length - 1) {
        return `PARALLAX_STEP(${row}, 0, ${layer.speed})`;
      }
      const str = `PARALLAX_STEP(${row}, ${row + layer.height}, ${
        layer.speed
      })`;
      row += layer.height;
      return str;
    });
    // For num layers = 1 or 2 append parallax terminator
    if (parallax.length < 3) {
      layers.push("PARALLAX_STEP(18, 0, 0)");
    }
    return layers;
  }
  return [`PARALLAX_STEP(0,0,0)`];
};

export const compileScene = (
  scene: PrecompiledScene,
  sceneIndex: number,
  {
    bgPalette,
    actorsPalette,
    eventPtrs,
  }: {
    bgPalette: number;
    actorsPalette: number;
    eventPtrs: PrecompiledSceneEventPtrs[];
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
      parallax_rows: compileParallax(
        scene.width > SCREEN_WIDTH ? scene.parallax : undefined
      ),
      palette: toFarPtr(paletteSymbol(bgPalette)),
      sprite_palette: toFarPtr(paletteSymbol(actorsPalette)),
      reserve_tiles: scene.actorsExclusiveLookup["player"] ?? 0,
      player_sprite: toFarPtr(spriteSheetSymbol(scene.playerSpriteIndex)),
      n_actors: scene.actors.length,
      n_triggers: scene.triggers.length,
      n_sprites: scene.sprites.length,
      n_projectiles: scene.projectiles.length,
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
      projectiles:
        scene.projectiles.length > 0
          ? toFarPtr(sceneProjectilesSymbol(sceneIndex))
          : undefined,
      script_init: maybeScriptFarPtr(eventPtrs[sceneIndex].start),
      script_p_hit1: maybeScriptFarPtr(eventPtrs[sceneIndex].playerHit1),
    },
    // Dependencies
    ([] as string[]).concat(
      backgroundSymbol(scene.backgroundIndex),
      sceneCollisionsSymbol(sceneIndex),
      paletteSymbol(bgPalette),
      paletteSymbol(actorsPalette),
      spriteSheetSymbol(scene.playerSpriteIndex),
      scene.actors.length ? sceneActorsSymbol(sceneIndex) : [],
      scene.triggers.length > 0 ? sceneTriggersSymbol(sceneIndex) : [],
      scene.sprites.length > 0 ? sceneSpritesSymbol(sceneIndex) : [],
      scene.projectiles.length > 0 ? sceneProjectilesSymbol(sceneIndex) : [],
      maybeScriptDependency(eventPtrs[sceneIndex].start),
      maybeScriptDependency(eventPtrs[sceneIndex].playerHit1)
    )
  );

export const compileSceneHeader = (
  scene: PrecompiledScene,
  sceneIndex: number
) =>
  toDataHeader(
    SCENE_TYPE,
    sceneSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}`
  );

export const compileBounds = ({
  boundsX,
  boundsY,
  boundsWidth,
  boundsHeight,
}: {
  boundsX?: number;
  boundsY?: number;
  boundsWidth?: number;
  boundsHeight?: number;
}): {
  left: number;
  bottom: number;
  right: number;
  top: number;
} => {
  const bX = boundsX || 0;
  const bY = boundsY || 0;
  const bW = boundsWidth || 16;
  const bH = boundsHeight || 16;
  return {
    left: bX,
    bottom: 7 - bY,
    right: bX + bW - 1,
    top: 8 - (bY + bH),
  };
};

export const compileSceneActors = (
  scene: PrecompiledScene,
  sceneIndex: number,
  sprites: PrecompiledSpriteSheetData[],
  { eventPtrs }: { eventPtrs: PrecompiledSceneEventPtrs[] }
) => {
  const events = eventPtrs[sceneIndex];

  return toStructArrayDataFile(
    ACTOR_TYPE,
    sceneActorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Actors`,
    filterNull(
      scene.actors.map((actor, actorIndex) => {
        const sprite = sprites.find((s) => s.id === actor.spriteSheetId);
        const spriteIndex = sprites.findIndex(
          (s) => s.id === actor.spriteSheetId
        );
        if (!sprite) return null;
        return {
          __comment: actorName(actor, actorIndex),
          pos: {
            x: `${actor.x * 8} * 16`,
            y: `${actor.y * 8} * 16`,
          },
          bounds: compileBounds(sprite),
          dir: dirEnum(actor.direction),
          sprite: toFarPtr(spriteSheetSymbol(spriteIndex)),
          move_speed: Math.round(actor.moveSpeed * 16),
          anim_tick: actor.animSpeed,
          pinned: actor.isPinned ? "TRUE" : "FALSE",
          collision_group: toASMCollisionGroup(actor.collisionGroup),
          collision_enabled: actor.isPinned ? "FALSE" : "TRUE",
          script_update: maybeScriptFarPtr(events.actorsMovement[actorIndex]),
          script: maybeScriptFarPtr(events.actors[actorIndex]),
          reserve_tiles: scene.actorsExclusiveLookup[actor.id] ?? 0,
        };
      })
    ),
    // Dependencies
    flatten(
      scene.actors.map((actor, actorIndex) => {
        const spriteIndex = sprites.findIndex(
          (s) => s.id === actor.spriteSheetId
        );
        return ([] as string[]).concat(
          spriteSheetSymbol(spriteIndex),
          maybeScriptDependency(events.actorsMovement[actorIndex]),
          maybeScriptDependency(events.actors[actorIndex])
        );
      })
    )
  );
};

export const compileSceneActorsHeader = (
  scene: PrecompiledScene,
  sceneIndex: number
) =>
  toArrayDataHeader(
    ACTOR_TYPE,
    sceneActorsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Actors`
  );

export const compileSceneTriggers = (
  scene: PrecompiledScene,
  sceneIndex: number,
  { eventPtrs }: { eventPtrs: PrecompiledSceneEventPtrs[] }
) =>
  toStructArrayDataFile(
    TRIGGER_TYPE,
    sceneTriggersSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Triggers`,
    scene.triggers.map((trigger, triggerIndex) => ({
      __comment: triggerName(trigger, triggerIndex),
      x: trigger.x,
      y: trigger.y,
      width: trigger.width,
      height: trigger.height,
      script: maybeScriptFarPtr(eventPtrs[sceneIndex].triggers[triggerIndex]),
      script_flags: toASMTriggerScriptFlags(trigger),
    })),
    // Dependencies
    flatten(
      scene.triggers.map((trigger, triggerIndex) => {
        return ([] as string[]).concat(
          maybeScriptDependency(eventPtrs[sceneIndex].triggers[triggerIndex])
        );
      })
    )
  );

export const compileSceneTriggersHeader = (
  scene: PrecompiledScene,
  sceneIndex: number
) =>
  toArrayDataHeader(
    TRIGGER_TYPE,
    sceneTriggersSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Triggers`
  );

export const compileSceneSprites = (
  scene: PrecompiledScene,
  sceneIndex: number
) =>
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

export const compileSceneSpritesHeader = (
  scene: PrecompiledScene,
  sceneIndex: number
) =>
  toArrayDataHeader(
    FARPTR_TYPE,
    sceneSpritesSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Sprites`
  );

export const compileSceneProjectiles = (
  scene: PrecompiledScene,
  sceneIndex: number,
  sprites: PrecompiledSpriteSheetData[]
) =>
  toStructArrayDataFile(
    PROJECTILE_TYPE,
    sceneProjectilesSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Projectiles`,
    filterNull(
      scene.projectiles.map((projectile, projectileIndex) => {
        const sprite = sprites.find((s) => s.id === projectile.spriteSheetId);
        const spriteIndex = sprites.findIndex(
          (s) => s.id === projectile.spriteSheetId
        );
        if (!sprite) return null;

        const animIndex =
          sprite.states.findIndex(
            (st) => st.name === projectile.spriteStateId
          ) ?? 0;
        const animOffsets =
          sprite.animationOffsets[animIndex * 8] || sprite.animationOffsets[0];

        return {
          __comment: `Projectile ${projectileIndex}`,
          sprite: toFarPtr(spriteSheetSymbol(spriteIndex)),
          move_speed: Math.round(projectile.speed * 16),
          life_time: Math.round(projectile.lifeTime * 60),
          collision_group: toASMCollisionGroup(projectile.collisionGroup),
          collision_mask: toASMCollisionMask(projectile.collisionMask),
          bounds: compileBounds(sprite),
          anim_tick: projectile.animSpeed,
          animations: sprite.animationOffsets.slice(0, 4),
          initial_offset: Math.round((projectile.initialOffset || 0) * 16),
        };
      })
    ),
    // Dependencies
    flatten(
      scene.projectiles.map((projectile) => {
        const spriteIndex = sprites.findIndex(
          (s) => s.id === projectile.spriteSheetId
        );
        return spriteSheetSymbol(spriteIndex);
      })
    )
  );

export const compileSceneProjectilesHeader = (
  scene: PrecompiledScene,
  sceneIndex: number
) =>
  toArrayDataHeader(
    FARPTR_TYPE,
    sceneProjectilesSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Projectiles`
  );

export const compileSceneCollisions = (
  scene: PrecompiledScene,
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

export const compileSceneCollisionsHeader = (
  scene: PrecompiledScene,
  sceneIndex: number
) =>
  toArrayDataHeader(
    DATA_TYPE,
    sceneCollisionsSymbol(sceneIndex),
    `// Scene: ${sceneName(scene, sceneIndex)}\n// Collisions`
  );

export const compileTileset = (tileset: Uint8Array, tilesetIndex: number) =>
  toStructDataFile(
    TILESET_TYPE,
    tilesetSymbol(tilesetIndex),
    `// Tileset: ${tilesetIndex}`,
    {
      n_tiles: Math.ceil(tileset.length / 16),
      tiles: Array.from(tileset.length > 0 ? tileset : [0]).map(toHex),
    }
  );

export const compileTilesetHeader = (
  _tileset: Uint8Array,
  tilesetIndex: number
) =>
  toDataHeader(
    TILESET_TYPE,
    tilesetSymbol(tilesetIndex),
    `// Tileset: ${tilesetIndex}`
  );

export const compileSpriteSheet = (
  spriteSheet: PrecompiledSpriteSheetData,
  spriteSheetIndex: number,
  {
    statesOrder,
    stateReferences,
  }: { statesOrder: string[]; stateReferences: string[] }
) => {
  const stateNames = spriteSheet.states.map((state) => state.name);
  const maxState = Math.max.apply(
    null,
    stateNames.map((state) => statesOrder.indexOf(state))
  );
  return `#pragma bank 255
// SpriteSheet: ${spriteSheet.name}
  
#include "gbs_types.h"
#include "data/${tilesetSymbol(spriteSheet.tilesetIndex)}.h"

${bankRef(spriteSheetSymbol(spriteSheetIndex))}

${stateReferences
  .map(
    (state, n) =>
      `#define SPRITE_${spriteSheetIndex}_${state} ${
        Math.max(0, stateNames.indexOf(statesOrder[n])) * 8
      }`
  )
  .join("\n")}

${spriteSheet.metasprites
  .map((metasprite, metaspriteIndex) => {
    return `const metasprite_t ${spriteSheetSymbol(
      spriteSheetIndex
    )}_metasprite_${metaspriteIndex}[]  = {
    ${metasprite
      .map((tile) => `{ ${tile.y}, ${tile.x}, ${tile.tile}, ${tile.props} }`)
      .join(", ")}${metasprite.length > 0 ? ",\n    " : ""}{metasprite_end}
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

const struct animation_t ${spriteSheetSymbol(spriteSheetIndex)}_animations[] = {
${spriteSheet.animationOffsets
  .map(
    (object) => `${" ".repeat(INDENT_SPACES)}{
${toStructData(object as unknown as Record<string, unknown>, 2 * INDENT_SPACES)}
${" ".repeat(INDENT_SPACES)}}`
  )
  .join(",\n")}
};

const UWORD ${spriteSheetSymbol(spriteSheetIndex)}_animations_lookup[] = {
${Array.from(Array(maxState + 1).keys())
  .map((n) => `    SPRITE_${spriteSheetIndex}_${stateReferences[n]}`)
  .join(",\n")}
};

${SPRITESHEET_TYPE} ${spriteSheetSymbol(spriteSheetIndex)} = {
${toStructData(
  {
    n_metasprites: spriteSheet.metaspritesOrder.length,
    emote_origin: { x: 0, y: -spriteSheet.canvasHeight },
    metasprites: `${spriteSheetSymbol(spriteSheetIndex)}_metasprites`,
    animations: `${spriteSheetSymbol(spriteSheetIndex)}_animations`,
    animations_lookup: `${spriteSheetSymbol(
      spriteSheetIndex
    )}_animations_lookup`,
    bounds: compileBounds(spriteSheet),
    tileset: toFarPtr(tilesetSymbol(spriteSheet.tilesetIndex)),
    cgb_tileset: "{ NULL, NULL }",
  },

  INDENT_SPACES
)}
};
`;
};

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
  backgroundIndex: number,
  {
    color,
  }: {
    color: boolean;
  }
) =>
  toStructDataFile(
    BACKGROUND_TYPE,
    backgroundSymbol(backgroundIndex),
    `// Background: ${background.name}`,
    {
      width: background.width,
      height: background.height,
      tileset: toFarPtr(tilesetSymbol(background.tilesetIndex)),
      cgb_tileset: "{ NULL, NULL }",
      tilemap: toFarPtr(tilemapSymbol(background.tilemapIndex)),
      cgb_tilemap_attr: color
        ? toFarPtr(tilemapAttrSymbol(background.tilemapAttrIndex))
        : "{ NULL, NULL }",
    },
    ([] as string[]).concat(
      tilesetSymbol(background.tilesetIndex),
      tilemapSymbol(background.tilemapIndex),
      color ? tilemapAttrSymbol(background.tilemapAttrIndex) : []
    )
  );

export const compileBackgroundHeader = (
  _background: PrecompiledBackground,
  backgroundIndex: number
) =>
  toDataHeader(
    BACKGROUND_TYPE,
    backgroundSymbol(backgroundIndex),
    `// Background: ${backgroundIndex}`
  );

export const compileTilemap = (tilemap: number[], tilemapIndex: number) =>
  toArrayDataFile(
    DATA_TYPE,
    tilemapSymbol(tilemapIndex),
    `// Tilemap ${tilemapIndex}`,
    Array.from(tilemap).map(wrap8Bit).map(toHex),
    16
  );

export const compileTilemapHeader = (tilemap: number[], tilemapIndex: number) =>
  toArrayDataHeader(
    DATA_TYPE,
    tilemapSymbol(tilemapIndex),
    `// Tilemap ${tilemapIndex}`
  );

export const compileTilemapAttr = (
  tilemapAttr: number[],
  tilemapAttrIndex: number
) =>
  toArrayDataFile(
    DATA_TYPE,
    tilemapAttrSymbol(tilemapAttrIndex),
    `// Tilemap Attr ${tilemapAttrIndex}`,
    Array.from(tilemapAttr).map(toHex),
    16
  );

export const compileTilemapAttrHeader = (
  tilemapAttr: number[],
  tilemapAttrIndex: number
) =>
  toArrayDataHeader(
    DATA_TYPE,
    tilemapAttrSymbol(tilemapAttrIndex),
    `// Tilemap Attr ${tilemapAttrIndex}`
  );

export const compileColor = (hex: string): string => {
  const r = Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
  const g = Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
  const b = Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));
  return `RGB(${r}, ${g}, ${b})`;
};

export const compilePalette = (
  palette: PrecompiledPalette,
  paletteIndex: number
) => `#pragma bank 255

// Palette: ${paletteIndex}

#include "gbs_types.h"

${bankRef(paletteSymbol(paletteIndex))}

${PALETTE_TYPE} ${paletteSymbol(paletteIndex)} = {
    .mask = 0xFF,
    .palette = {
${palette.dmg
  .map(
    (paletteColors: string[]) =>
      `        DMG_PALETTE(${paletteColors.join(", ")})`
  )
  .join(",\n")}
    }${
      palette.colors
        ? `,
    .cgb_palette = {
${palette.colors
  .map(
    (paletteColors: string[]) =>
      `        CGB_PALETTE(${paletteColors.map(compileColor).join(", ")})`
  )
  .join(",\n")} 
    }`
        : ""
    }
};
`;

export const compilePaletteHeader = (
  palette: PrecompiledPalette,
  paletteIndex: number
) =>
  toDataHeader(
    PALETTE_TYPE,
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

${
  font.isVariableWidth
    ? `static const UBYTE ${fontSymbol(fontIndex)}_widths[] = {
${chunk(Array.from(font.widths), 16)
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
  .join(",\n")}
};

`
    : ""
}static const UBYTE ${fontSymbol(fontIndex)}_bitmaps[] = {
${chunk(Array.from(Array.from(font.data).map(toHex)), 16)
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
  .join(",\n")}
};

${bankRef(fontSymbol(fontIndex))}
const font_desc_t ${fontSymbol(fontIndex)} = {
    ${toFlags([
      ...(true ? [FONT_FLAG_FONT_RECODE] : []),
      ...(font.isVariableWidth ? [FONT_FLAG_FONT_VWF] : []),
      ...(font.is1Bit && font.isVariableWidth ? [FONT_FLAG_FONT_VWF_1BIT] : []),
    ])}, 
    ${font.table.length <= 128 ? FONT_FLAG_FONT_RECODE_SIZE_7BIT : `0xFF`},
    ${fontSymbol(fontIndex)}_table,
    ${font.isVariableWidth ? `${fontSymbol(fontIndex)}_widths` : "NULL"},
    ${fontSymbol(fontIndex)}_bitmaps
};
`;

export const compileFontHeader = (data: FontData, fontIndex: number) =>
  toArrayDataHeader(DATA_TYPE, fontSymbol(fontIndex), `// Font`);

export const compileAvatarFont = (
  avatars: AvatarData[],
  avatarFontIndex: number
) => `#pragma bank 255
  
// Avatar Font ${avatarFontIndex}
  
#include "gbs_types.h"

static const UBYTE ${avatarFontSymbol(avatarFontIndex)}_table[] = {
${chunk(
  Array.from(Array(4 * avatars.length)).map((_, i) => toHex(i)),
  16
)
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
  .join(",\n")}
};

static const UBYTE ${avatarFontSymbol(avatarFontIndex)}_bitmaps[] = {
${chunk(avatars.map((a) => Array.from(a.data).map(toHex)).flat(), 16)
  .map((r) => " ".repeat(INDENT_SPACES) + r.join(", "))
  .join(",\n")}
};
  
${bankRef(avatarFontSymbol(avatarFontIndex))}
const font_desc_t ${avatarFontSymbol(avatarFontIndex)} = {
    ${toFlags([FONT_FLAG_FONT_RECODE])}, 
    0x3F,
    ${avatarFontSymbol(avatarFontIndex)}_table,
    NULL,
    ${avatarFontSymbol(avatarFontIndex)}_bitmaps
};
`;

export const compileAvatarFontHeader = (avatarFontIndex: number) =>
  toArrayDataHeader(
    DATA_TYPE,
    avatarFontSymbol(avatarFontIndex),
    `// Avatar Font ${avatarFontIndex}`
  );

export const compileFrameImage = (data: Uint8Array) =>
  toArrayDataFile(
    DATA_TYPE,
    "frame_image",
    `// Frame`,
    Array.from(data).map(toHex),
    16
  );

export const compileFrameImageHeader = (_data: Uint8Array) =>
  toArrayDataHeader(DATA_TYPE, "frame_image", `// Frame`);

export const compileEmote = (emote: EmoteData, emoteIndex: number) =>
  toArrayDataFile(
    DATA_TYPE,
    emoteSymbol(emoteIndex),
    `// Emote ${emoteIndex}`,
    Array.from(emote.data).map(toHex),
    16
  );

export const compileEmoteHeader = (emote: EmoteData, emoteIndex: number) =>
  toArrayDataHeader(
    DATA_TYPE,
    emoteSymbol(emoteIndex),
    `// Emote ${emoteIndex}`
  );

export const compileCursorImage = (data: Uint8Array) =>
  toArrayDataFile(
    DATA_TYPE,
    "cursor_image",
    `// Cursor`,
    Array.from(data).map(toHex),
    16
  );

export const compileCursorImageHeader = (_data: Uint8Array) =>
  toArrayDataHeader(DATA_TYPE, "cursor_image", `// Cursor`);

export const compileScriptHeader = (scriptName: string) =>
  toArrayDataHeader(DATA_TYPE, scriptName, `// Script ${scriptName}`);

export const compileGameGlobalsInclude = (
  variableAliasLookup: Dictionary<string>,
  stateReferences: string[]
) => {
  const variables = Object.values(variableAliasLookup) as string[];
  return (
    variables
      .map((string, stringIndex) => {
        return `${string} = ${stringIndex}\n`;
      })
      .join("") +
    `MAX_GLOBAL_VARS = ${variables.length}\n` +
    stateReferences
      .map((string, stringIndex) => {
        return `${string} = ${stringIndex}\n`;
      })
      .join("")
  );
};

export const compileSaveSignature = (data: string) => {
  const generateHash = function (input: string) {
    let hash = 0,
      i,
      chr;
    if (input.length === 0) return hash;
    for (i = 0; i < input.length; i++) {
      chr = input.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };
  const hash = generateHash(data);
  return `const unsigned long save_signature = 0x${decHex32Val(hash)};`;
};
