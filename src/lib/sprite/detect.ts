import uuid from "uuid";
import { animationIndexBySpriteType } from "../../components/sprites/helpers";
import {
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
  SpriteAnimationType,
  SpriteSheet,
  SpriteState,
} from "store/features/entities/entitiesTypes";
import { assetFilename } from "../helpers/gbstudio";
import DetectSpriteWorker, { DetectSpriteResult } from "./detectSprite.worker";
import {
  Position,
  roundUp16,
  SliceDef,
  SpriteCluster,
  SpriteTileLocation,
} from "./spriteData";

interface DetectedSprite {
  spriteSheetId: string;
  spriteAnimations: SpriteAnimation[];
  spriteStates: SpriteState[];
  metasprites: Metasprite[];
  metaspriteTiles: MetaspriteTile[];
  state: SpriteState;
  changes: Partial<SpriteSheet>;
}

export const detect = (
  spriteSheet: SpriteSheet,
  projectRoot: string
): Promise<DetectedSprite> => {
  const filename = `file://${assetFilename(
    projectRoot,
    "sprites",
    spriteSheet
  )}?_v=${spriteSheet._v}`;

  return new Promise((resolve, reject) => {
    const failedTimer = setTimeout(() => reject("Detect timeout"), 5000);
    const worker = new DetectSpriteWorker();
    worker.postMessage(filename);
    worker.onmessage = (res: MessageEvent<DetectSpriteResult>) => {
      const tileDefs: SliceDef[] = res.data.tileDefs;
      const spriteTileLocations: SpriteTileLocation[][] =
        res.data.spriteTileLocations;
      const spriteDefs: SliceDef[] = res.data.spriteDefs;
      const alignmentOffsets: Position[] = res.data.alignmentOffsets;
      const spriteClusters: SpriteCluster[] = res.data.spriteClusters;

      const animations: SpriteAnimation[] = Array.from(Array(8)).map(() => ({
        id: uuid(),
        frames: [],
      }));
      const metasprites: Metasprite[] = [];
      const metaspriteTiles: MetaspriteTile[] = [];

      let animationType: SpriteAnimationType = "multi_movement";
      let flipLeft = false;
      if (spriteClusters.length === 1) {
        animationType = "fixed";
      } else if (spriteClusters.length === 2) {
        animationType = "fixed_movement";
      } else if (spriteClusters.length === 3) {
        animationType = "multi";
        flipLeft = true;
      } else if (
        spriteClusters.length === 4 &&
        spriteSheet.filename.indexOf("platform") > -1
      ) {
        animationType = "platform_player";
        flipLeft = true;
      } else if (spriteClusters.length === 4) {
        animationType = "multi";
      } else if (spriteClusters.length === 6) {
        animationType = "multi_movement";
        flipLeft = true;
      } else if (spriteClusters.length === 7) {
        animationType = "platform_player";
        flipLeft = true;
      }

      for (let ci = 0; ci < spriteClusters.length; ci++) {
        const cluster = spriteClusters[ci];
        for (const spriteDef of cluster.sprites) {
          const si = spriteDefs.indexOf(spriteDef);
          const metasprite: Metasprite = {
            id: uuid(),
            tiles: [],
          };
          for (let ti = 0; ti < tileDefs.length; ti++) {
            for (let li = 0; li < spriteTileLocations[ti].length; li++) {
              const loc = spriteTileLocations[ti][li];
              const def = tileDefs[ti];
              if (loc.spriteIndex !== si) {
                continue;
              }
              const tile: MetaspriteTile = {
                id: uuid(),
                x: loc.x + alignmentOffsets[si].x,
                y:
                  spriteDef.coordinates.height -
                  loc.y +
                  alignmentOffsets[si].y -
                  16,
                sliceX: def.coordinates.x,
                sliceY: def.coordinates.y,
                flipX: loc.flipX,
                flipY: loc.flipY,
                palette: 0,
                paletteIndex: 0,
                objPalette: "OBP0",
                priority: false,
              };
              metaspriteTiles.push(tile);
              metasprite.tiles.unshift(tile.id);
            }
          }

          metasprites.push(metasprite);
          animations[
            animationIndexBySpriteType(ci, animationType, flipLeft)
          ].frames.push(metasprite.id);
        }
      }

      // Create blank metasprite for empty animations
      for (const animation of animations) {
        if (animation.frames.length === 0) {
          const metasprite: Metasprite = {
            id: uuid(),
            tiles: [],
          };
          animation.frames.push(metasprite.id);
          metasprites.push(metasprite);
        }
      }

      const furthestX = Math.max.apply(
        null,
        metaspriteTiles.map((tile) => {
          return tile.x > 0 ? tile.x : 8 - tile.x;
        })
      );

      const furthestY =
        Math.max.apply(
          null,
          metaspriteTiles.map((tile) => {
            return tile.y;
          })
        ) + 16;

      const state: SpriteState = {
        id: spriteSheet.states?.[0] || uuid(),
        name: "",
        animationType,
        flipLeft,
        animations: animations.map((a) => a.id),
      };

      const changes: Partial<SpriteSheet> = {
        canvasWidth: roundUp16(furthestX * 2),
        canvasHeight: roundUp16(furthestY),
      };

      clearTimeout(failedTimer);
      return resolve({
        spriteSheetId: spriteSheet.id,
        spriteAnimations: animations,
        spriteStates: [],
        metasprites,
        metaspriteTiles,
        state,
        changes,
      });
    };
  });
};

// Classic detection - GB Studio 1.0 & 2.0 sprite format
export const detectClassic = (spriteSheet: SpriteSheet): DetectedSprite => {
  const numFrames = Math.floor(spriteSheet.width / 16);

  const animations: SpriteAnimation[] = Array.from(Array(8)).map(() => ({
    id: uuid(),
    frames: [],
  }));
  const metasprites: Metasprite[] = [];
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
    const metasprite: Metasprite = {
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
        (tile) => originalMetasprite.tiles[0] === tile.id
      ) as MetaspriteTile;
      const originalTileRight = metaspriteTiles.find(
        (tile) => originalMetasprite.tiles[1] === tile.id
      ) as MetaspriteTile;
      const tileLeft: MetaspriteTile = {
        ...originalTileLeft,
        id: uuid(),
      };
      const tileRight: MetaspriteTile = {
        ...originalTileRight,
        id: uuid(),
      };
      const metasprite: Metasprite = {
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
      const metasprite: Metasprite = {
        id: uuid(),
        tiles: [],
      };
      animation.frames.push(metasprite.id);
      metasprites.push(metasprite);
    }
  }

  const state: SpriteState = {
    id: spriteSheet.states?.[0] || uuid(),
    name: "",
    animationType,
    flipLeft,
    animations: animations.map((a) => a.id),
  };

  const changes: Partial<SpriteSheet> = {
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
