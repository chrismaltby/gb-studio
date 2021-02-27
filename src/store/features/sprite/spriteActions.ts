import { createAction } from "@reduxjs/toolkit";
import {
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
} from "../entities/entitiesTypes";

const detectSprite = createAction<{ spriteSheetId: string }>(
  "sprite/detect/pending"
);
const detectSpriteComplete = createAction<{
  spriteSheetId: string;
  spriteAnimations: SpriteAnimation[];
  metasprites: Metasprite[];
  metaspriteTiles: MetaspriteTile[];
}>("sprite/detect/fulfilled");

export default {
  detectSprite,
  detectSpriteComplete,
};
