import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import actions from "./spriteActions";
import { spriteSheetSelectors } from "../entities/entitiesState";
import { assetFilename } from "../../../lib/helpers/gbstudio";
import DetectSpriteWorker from "../../../lib/sprite/detectSprite.worker";
import {
  SliceDef,
  SpriteTileLocation,
  Position,
} from "../../../lib/sprite/spriteDetection";
import uuid from "uuid";
import {
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
} from "../entities/entitiesTypes";

const spriteMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (actions.detectSprite.match(action)) {
    const state = store.getState();
    const projectRoot = state.document.root;

    const spriteSheet = spriteSheetSelectors.selectById(
      state,
      action.payload.spriteSheetId
    );

    if (!spriteSheet) {
      return next(action);
    }

    const filename = `file://${assetFilename(
      projectRoot,
      "sprites",
      spriteSheet
    )}?_v=${spriteSheet._v}`;

    const worker = new DetectSpriteWorker();
    worker.postMessage(filename);
    worker.onmessage = (res: any) => {
      const tileDefs: SliceDef[] = res.data.tileDefs;
      const spriteTileLocations: SpriteTileLocation[][] =
        res.data.spriteTileLocations;
      const spriteDefs: SliceDef[] = res.data.spriteDefs;
      const alignmentOffsets: Position[] = res.data.alignmentOffsets;
      const animations: SpriteAnimation[] = Array.from(Array(8)).map(() => ({
        id: uuid(),
        frames: [],
      }));
      const metasprites: Metasprite[] = [];
      const metaspriteTiles: MetaspriteTile[] = [];

      for (let si = 0; si < spriteDefs.length; si++) {
        const spriteDef = spriteDefs[si];
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
            };
            metaspriteTiles.push(tile);
            metasprite.tiles.push(tile.id);
          }
        }

        metasprites.push(metasprite);
        animations[0].frames.push(metasprite.id);
      }

      store.dispatch(
        actions.detectSpriteComplete({
          spriteSheetId: action.payload.spriteSheetId,
          spriteAnimations: animations,
          metasprites,
          metaspriteTiles,
        })
      );
    };
  }

  return next(action);
};

export default spriteMiddleware;
