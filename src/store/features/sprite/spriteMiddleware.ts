import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import actions from "./spriteActions";
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

  return next(action);
};

export default spriteMiddleware;
