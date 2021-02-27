import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import actions from "./spriteActions";
import { spriteSheetSelectors } from "../entities/entitiesState";
import { assetFilename } from "../../../lib/helpers/gbstudio";
import DetectSpriteWorker from "../../../lib/sprite/detectSprite.worker";

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
      console.log("DONE", res);
    };
  }

  return next(action);
};

export default spriteMiddleware;
