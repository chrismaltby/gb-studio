import { createAction } from "@reduxjs/toolkit";
import {
  MetaspriteNormalized,
  SpriteAnimationNormalized,
  SpriteSheetNormalized,
  SpriteStateNormalized,
} from "shared/lib/entities/entitiesTypes";
import { MetaspriteTile } from "shared/lib/resources/types";

const detectSprite = createAction<{ spriteSheetId: string }>(
  "sprite/detect/pending",
);
const detectSpriteComplete = createAction<{
  spriteSheetId: string;
  spriteAnimations: SpriteAnimationNormalized[];
  spriteStates: SpriteStateNormalized[];
  metasprites: MetaspriteNormalized[];
  metaspriteTiles: MetaspriteTile[];
  state: SpriteStateNormalized;
  changes: Partial<SpriteSheetNormalized>;
}>("sprite/detect/fulfilled");

const compileSprite = createAction(
  "sprite/compile",
  (payload: { spriteSheetId: string }) => ({
    payload,
    meta: { throttle: 2000, key: payload.spriteSheetId },
  }),
);

const spriteActions = {
  detectSprite,
  detectSpriteComplete,
  compileSprite,
};

export default spriteActions;
