import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import actions from "./spriteActions";
import projectActions from "store/features/project/projectActions";
import {
  metaspriteSelectors,
  metaspriteTileSelectors,
  spriteAnimationSelectors,
  spriteStateSelectors,
  spriteSheetSelectors,
} from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { detectClassic } from "renderer/lib/sprites/detect";
import {
  denormalizeSprite,
  matchAssetEntity,
} from "shared/lib/entities/entitiesHelpers";
import API from "renderer/lib/api";
import { getSettings } from "store/features/settings/settingsState";

const spriteMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.detectSprite.match(action)) {
      const state = store.getState();

      const spriteSheet = spriteSheetSelectors.selectById(
        state,
        action.payload.spriteSheetId,
      );

      if (!spriteSheet) {
        return next(action);
      }

      if (spriteSheet.height === 16) {
        store.dispatch(
          actions.detectSpriteComplete(
            // Classic Sprite Format
            detectClassic(spriteSheet),
          ),
        );
      }
    }

    next(action);

    // Trigger recompile if sprite animations or tiles have changed
    if (
      entitiesActions.addMetasprite.match(action) ||
      entitiesActions.cloneMetasprites.match(action) ||
      entitiesActions.sendMetaspriteTilesToFront.match(action) ||
      entitiesActions.sendMetaspriteTilesToBack.match(action) ||
      entitiesActions.removeMetasprite.match(action) ||
      entitiesActions.addMetaspriteTile.match(action) ||
      entitiesActions.moveMetaspriteTiles.match(action) ||
      entitiesActions.moveMetaspriteTilesRelative.match(action) ||
      entitiesActions.flipXMetaspriteTiles.match(action) ||
      entitiesActions.flipYMetaspriteTiles.match(action) ||
      entitiesActions.editMetaspriteTile.match(action) ||
      entitiesActions.editMetaspriteTiles.match(action) ||
      entitiesActions.removeMetaspriteTiles.match(action) ||
      entitiesActions.removeMetaspriteTilesOutsideCanvas.match(action) ||
      entitiesActions.editSpriteAnimation.match(action) ||
      entitiesActions.moveSpriteAnimationFrame.match(action) ||
      (entitiesActions.editSpriteSheet.match(action) &&
        action.payload.changes.spriteMode !== undefined)
    ) {
      store.dispatch(
        actions.compileSprite({ spriteSheetId: action.payload.spriteSheetId }),
      );
    }

    // Compile sprite to determine how many tiles it will use
    if (actions.compileSprite.match(action)) {
      const state = store.getState();

      const spriteSheet = spriteSheetSelectors.selectById(
        state,
        action.payload.spriteSheetId,
      );

      if (!spriteSheet) {
        return next(action);
      }

      const metasprites = metaspriteSelectors.selectEntities(state);
      const metaspriteTiles = metaspriteTileSelectors.selectEntities(state);
      const spriteAnimations = spriteAnimationSelectors.selectEntities(state);
      const spriteStates = spriteStateSelectors.selectEntities(state);

      const spriteData = denormalizeSprite({
        sprite: spriteSheet,
        metasprites,
        metaspriteTiles,
        spriteAnimations,
        spriteStates,
      });

      const settings = getSettings(state);

      const res = await API.sprite.compileSprite(
        spriteData,
        settings.spriteMode,
      );
      const numTiles =
        (spriteSheet.spriteMode ?? settings.spriteMode) === "8x16"
          ? res.tiles.length / 2
          : res.tiles.length;

      if (numTiles !== spriteSheet.numTiles) {
        store.dispatch(
          entitiesActions.editSpriteSheet({
            spriteSheetId: action.payload.spriteSheetId,
            changes: {
              numTiles,
            },
          }),
        );
      }
    }

    if (projectActions.loadProject.fulfilled.match(action)) {
      for (const spriteSheetId of action.payload.modifiedSpriteIds) {
        store.dispatch(actions.detectSprite({ spriteSheetId }));
        store.dispatch(actions.compileSprite({ spriteSheetId }));
      }
    }

    if (entitiesActions.loadSprite.match(action)) {
      const state = store.getState();

      const spriteSheet = spriteSheetSelectors.selectById(
        state,
        action.payload.data.id,
      );

      if (spriteSheet) {
        const spriteStateLookup = spriteStateSelectors.selectEntities(state);
        const spriteAnimationLookup =
          spriteAnimationSelectors.selectEntities(state);
        const spriteFrameLookup = metaspriteSelectors.selectEntities(state);

        const spriteStates = spriteSheet.states
          .map((id) => spriteStateLookup[id])
          .filter((i) => i);
        const spriteAnimationIds = spriteStates.map((s) => s.animations).flat();
        const spriteAnimations = spriteAnimationIds
          .map((id) => spriteAnimationLookup[id])
          .filter((i) => i);
        const spriteFrameIds = spriteAnimations.map((s) => s.frames).flat();
        const spriteFrames = spriteFrameIds
          .map((id) => spriteFrameLookup[id])
          .filter((i) => i);

        const hasNoDefinedTiles = spriteFrames.every(
          (a) => a.tiles.length === 0,
        );

        // If this is a newly added sprite with no detected animations
        // then try auto detecting the tile data
        if (hasNoDefinedTiles) {
          store.dispatch(
            actions.detectSprite({ spriteSheetId: spriteSheet.id }),
          );
        }
        store.dispatch(
          actions.compileSprite({ spriteSheetId: spriteSheet.id }),
        );
      } else {
        // Sprite may have been modified with no .gbsres file created yet, try matching on filename
        // to recompile based on updated image ensuring unique tile count values are accurate
        const allSprites = spriteSheetSelectors.selectAll(state);
        const spriteSheet = matchAssetEntity(action.payload.data, allSprites);
        if (spriteSheet) {
          store.dispatch(
            actions.compileSprite({ spriteSheetId: spriteSheet.id }),
          );
        }
      }
    }
  };

export default spriteMiddleware;
