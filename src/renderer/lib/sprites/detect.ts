import uuid from "uuid";
import type {
  MetaspriteNormalized,
  SpriteAnimationNormalized,
  SpriteSheetNormalized,
  SpriteStateNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  MetaspriteTile,
  SpriteAnimationType,
} from "shared/lib/resources/types";

interface DetectedSprite {
  spriteSheetId: string;
  spriteAnimations: SpriteAnimationNormalized[];
  spriteStates: SpriteStateNormalized[];
  metasprites: MetaspriteNormalized[];
  metaspriteTiles: MetaspriteTile[];
  state: SpriteStateNormalized;
  changes: Partial<SpriteSheetNormalized>;
}

// Classic detection - GB Studio 1.0 & 2.0 sprite format
export const detectClassic = (
  spriteSheet: SpriteSheetNormalized,
): DetectedSprite => {
  const numFrames = Math.floor(spriteSheet.width / 16);

  const animations: SpriteAnimationNormalized[] = Array.from(Array(8)).map(
    () => ({
      id: uuid(),
      frames: [],
    }),
  );
  const metasprites: MetaspriteNormalized[] = [];
  const metaspriteTiles: MetaspriteTile[] = [];

  for (let i = 0; i < numFrames; i++) {
    const tileLeft: MetaspriteTile = {
      id: uuid(),
      x: 0,
      y: 0,
      sliceX: i * 16,
      sliceY: 0,
      flipX: false,
      flipY: false,
      palette: 0,
      paletteIndex: 0,
      objPalette: "OBP0",
      priority: false,
    };
    const tileRight: MetaspriteTile = {
      id: uuid(),
      x: 8,
      y: 0,
      sliceX: i * 16 + 8,
      sliceY: 0,
      flipX: false,
      flipY: false,
      palette: 0,
      paletteIndex: 0,
      objPalette: "OBP0",
      priority: false,
    };
    const metasprite: MetaspriteNormalized = {
      id: uuid(),
      tiles: [tileLeft.id, tileRight.id],
    };
    metaspriteTiles.push(tileLeft);
    metaspriteTiles.push(tileRight);
    metasprites.push(metasprite);
  }

  let animationType: SpriteAnimationType = "fixed";
  let flipLeft = false;
  if (numFrames === 3) {
    animationType = "multi";
    flipLeft = true;
    animations[0].frames.push(metasprites[2].id);
    animations[2].frames.push(metasprites[1].id);
    animations[3].frames.push(metasprites[0].id);
  } else if (numFrames === 6) {
    animationType = "multi_movement";
    flipLeft = true;

    // Clone idle frames
    [4, 2, 0].forEach((index) => {
      const originalMetasprite = metasprites[index];
      const originalTileLeft = metaspriteTiles.find(
        (tile) => originalMetasprite.tiles[0] === tile.id,
      ) as MetaspriteTile;
      const originalTileRight = metaspriteTiles.find(
        (tile) => originalMetasprite.tiles[1] === tile.id,
      ) as MetaspriteTile;
      const tileLeft: MetaspriteTile = {
        ...originalTileLeft,
        id: uuid(),
      };
      const tileRight: MetaspriteTile = {
        ...originalTileRight,
        id: uuid(),
      };
      const metasprite: MetaspriteNormalized = {
        id: uuid(),
        tiles: [tileLeft.id, tileRight.id],
      };
      metaspriteTiles.push(tileLeft);
      metaspriteTiles.push(tileRight);
      metasprites.push(metasprite);
    });

    animations[0].frames.push(metasprites[6].id);
    animations[2].frames.push(metasprites[7].id);
    animations[3].frames.push(metasprites[8].id);
    animations[4].frames.push(metasprites[5].id);
    animations[4].frames.push(metasprites[4].id);
    animations[6].frames.push(metasprites[3].id);
    animations[6].frames.push(metasprites[2].id);
    animations[7].frames.push(metasprites[1].id);
    animations[7].frames.push(metasprites[0].id);
  } else {
    for (let i = 0; i < metasprites.length; i++) {
      animations[0].frames.push(metasprites[i].id);
    }
  }

  // Create blank metasprite for empty animations
  for (const animation of animations) {
    if (animation.frames.length === 0) {
      const metasprite: MetaspriteNormalized = {
        id: uuid(),
        tiles: [],
      };
      animation.frames.push(metasprite.id);
      metasprites.push(metasprite);
    }
  }

  const state: SpriteStateNormalized = {
    id: spriteSheet.states?.[0] || uuid(),
    name: "",
    animationType,
    flipLeft,
    animations: animations.map((a) => a.id),
  };

  const changes: Partial<SpriteSheetNormalized> = {
    canvasWidth: 16,
    canvasHeight: 16,
  };

  return {
    spriteSheetId: spriteSheet.id,
    spriteAnimations: animations,
    spriteStates: [],
    metasprites,
    metaspriteTiles,
    state,
    changes,
  };
};
