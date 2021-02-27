import { createAction } from "@reduxjs/toolkit";

const detectSprite = createAction<{ spriteSheetId: string }>("sprite/detect");

export default {
  detectSprite,
};
