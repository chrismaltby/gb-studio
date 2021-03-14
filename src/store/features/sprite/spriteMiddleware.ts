import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import actions from "./spriteActions";
import projectActions from "../project/projectActions";
import { spriteSheetSelectors } from "../entities/entitiesState";
import { detect, detectClassic } from "../../../lib/sprite/detect";

const spriteMiddleware: Middleware<{}, RootState> = (store) => (next) => async (
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

    if (spriteSheet.height === 16) {
      store.dispatch(
        actions.detectSpriteComplete(
          // Classic Sprite Format
          detectClassic(spriteSheet)
        )
      );
    } else {
      store.dispatch(
        actions.detectSpriteComplete(await detect(spriteSheet, projectRoot))
      );
    }
  }

  next(action);

  if (projectActions.loadProject.fulfilled.match(action)) {
    const state = store.getState();
    const spriteSheets = spriteSheetSelectors.selectAll(state);
    for (const spriteSheet of spriteSheets) {
      if (
        !spriteSheet.animations ||
        spriteSheet.animations.length === 0 ||
        spriteSheet.autoDetect
      ) {
        store.dispatch(actions.detectSprite({ spriteSheetId: spriteSheet.id }));
      }
    }
  }

  if (projectActions.loadSprite.fulfilled.match(action)) {
    const state = store.getState();
    const spriteSheet = spriteSheetSelectors.selectById(
      state,
      action.payload.data.id
    );
    if (spriteSheet) {
      if (
        !spriteSheet.animations ||
        spriteSheet.animations.length === 0 ||
        spriteSheet.autoDetect
      ) {
        store.dispatch(actions.detectSprite({ spriteSheetId: spriteSheet.id }));
      }
    }
  }
};

export default spriteMiddleware;
