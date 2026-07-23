import {
  isAnyOf,
  type ListenerMiddlewareInstance,
  type PayloadAction,
} from "@reduxjs/toolkit";
import API from "renderer/lib/api";
import { detectClassic } from "renderer/lib/sprites/detect";
import {
  denormalizeSprite,
  matchAssetEntity,
} from "shared/lib/entities/entitiesHelpers";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  metaspriteSelectors,
  metaspriteTileSelectors,
  spriteAnimationSelectors,
  spriteSheetSelectors,
  spriteStateSelectors,
} from "store/features/entities/entitiesSelectors";
import projectActions from "store/features/project/projectActions";
import { getSettings } from "store/features/settings/settingsState";
import type { RootState } from "store/storeTypes";
import spriteActions from "./spriteActions";

type StartAppListening =
  ListenerMiddlewareInstance<RootState>["startListening"];

const isSpriteMutation = isAnyOf(
  entitiesActions.addMetasprite,
  entitiesActions.cloneMetasprites,
  entitiesActions.sendMetaspriteTilesToFront,
  entitiesActions.sendMetaspriteTilesToBack,
  entitiesActions.removeMetasprite,
  entitiesActions.addMetaspriteTile,
  entitiesActions.moveMetaspriteTiles,
  entitiesActions.moveMetaspriteTilesRelative,
  entitiesActions.flipXMetaspriteTiles,
  entitiesActions.flipYMetaspriteTiles,
  entitiesActions.editMetaspriteTile,
  entitiesActions.editMetaspriteTiles,
  entitiesActions.removeMetaspriteTiles,
  entitiesActions.removeMetaspriteTilesOutsideCanvas,
  entitiesActions.editSpriteAnimation,
  entitiesActions.moveSpriteAnimationFrame,
);

export const registerSpriteListeners = (startListening: StartAppListening) => {
  startListening({
    actionCreator: spriteActions.detectSprite,
    effect: (action, listenerApi) => {
      const state = listenerApi.getState();
      const spriteSheet = spriteSheetSelectors.selectById(
        state,
        action.payload.spriteSheetId,
      );

      if (spriteSheet?.height === 16) {
        listenerApi.dispatch(
          spriteActions.detectSpriteComplete(detectClassic(spriteSheet)),
        );
      }
    },
  });

  startListening({
    matcher: (action): action is PayloadAction<{ spriteSheetId: string }> =>
      isSpriteMutation(action),
    effect: (action, listenerApi) => {
      listenerApi.dispatch(
        spriteActions.compileSprite({
          spriteSheetId: action.payload.spriteSheetId,
        }),
      );
    },
  });

  startListening({
    actionCreator: entitiesActions.editSpriteSheet,
    effect: (action, listenerApi) => {
      if (action.payload.changes.spriteMode !== undefined) {
        listenerApi.dispatch(
          spriteActions.compileSprite({
            spriteSheetId: action.payload.spriteSheetId,
          }),
        );
      }
    },
  });

  startListening({
    actionCreator: spriteActions.compileSprite,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState();
      const spriteSheet = spriteSheetSelectors.selectById(
        state,
        action.payload.spriteSheetId,
      );

      if (!spriteSheet) {
        return;
      }

      const spriteData = denormalizeSprite({
        sprite: spriteSheet,
        metasprites: metaspriteSelectors.selectEntities(state),
        metaspriteTiles: metaspriteTileSelectors.selectEntities(state),
        spriteAnimations: spriteAnimationSelectors.selectEntities(state),
        spriteStates: spriteStateSelectors.selectEntities(state),
      });
      const settings = getSettings(state);
      const result = await API.sprite.compileSprite(
        spriteData,
        settings.spriteMode,
      );
      const numTiles =
        (spriteSheet.spriteMode ?? settings.spriteMode) === "8x16"
          ? result.tiles.length / 2
          : result.tiles.length;

      if (numTiles !== spriteSheet.numTiles) {
        listenerApi.dispatch(
          entitiesActions.editSpriteSheet({
            spriteSheetId: action.payload.spriteSheetId,
            changes: { numTiles },
          }),
        );
      }
    },
  });

  startListening({
    actionCreator: projectActions.loadProject.fulfilled,
    effect: (action, listenerApi) => {
      for (const spriteSheetId of action.payload.modifiedSpriteIds) {
        listenerApi.dispatch(spriteActions.detectSprite({ spriteSheetId }));
        listenerApi.dispatch(spriteActions.compileSprite({ spriteSheetId }));
      }
    },
  });

  startListening({
    actionCreator: entitiesActions.loadSprite,
    effect: (action, listenerApi) => {
      const state = listenerApi.getState();
      const spriteSheet = spriteSheetSelectors.selectById(
        state,
        action.payload.data.id,
      );

      if (spriteSheet) {
        const spriteStates = spriteSheet.states
          .map((id) => spriteStateSelectors.selectEntities(state)[id])
          .filter((item) => item);
        const spriteAnimationIds = spriteStates.flatMap(
          (spriteState) => spriteState.animations,
        );
        const spriteAnimations = spriteAnimationIds
          .map((id) => spriteAnimationSelectors.selectEntities(state)[id])
          .filter((item) => item);
        const spriteFrameIds = spriteAnimations.flatMap(
          (animation) => animation.frames,
        );
        const spriteFrames = spriteFrameIds
          .map((id) => metaspriteSelectors.selectEntities(state)[id])
          .filter((item) => item);
        const hasNoDefinedTiles = spriteFrames.every(
          (frame) => frame.tiles.length === 0,
        );

        if (hasNoDefinedTiles) {
          listenerApi.dispatch(
            spriteActions.detectSprite({ spriteSheetId: spriteSheet.id }),
          );
        }
        listenerApi.dispatch(
          spriteActions.compileSprite({ spriteSheetId: spriteSheet.id }),
        );
        return;
      }

      const matchedSpriteSheet = matchAssetEntity(
        action.payload.data,
        spriteSheetSelectors.selectAll(state),
      );
      if (matchedSpriteSheet) {
        listenerApi.dispatch(
          spriteActions.compileSprite({
            spriteSheetId: matchedSpriteSheet.id,
          }),
        );
      }
    },
  });
};
