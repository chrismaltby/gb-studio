/* eslint-disable import/prefer-default-export */
import Path from "path";
import { SPRITE_TYPE_STATIC } from "../../consts";

export const spriteTypeFromNumFrames = (numFrames) => {
  if (numFrames === 6) {
    return "actor_animated";
  }
  if (numFrames === 3) {
    return "actor";
  }
  if (numFrames === 1) {
    return "static";
  }
  return "animated";
};

export const framesPerDirection = (spriteType, numFrames) => {
  if (spriteType === SPRITE_TYPE_STATIC) {
    // If movement type is static and cycling frames
    return numFrames;
  }
  if (numFrames === 6) {
    return 2; // Actor Animated
  }
  if (numFrames === 3) {
    return 1; // Actor
  }
  // Static;
  return numFrames;
};

export const directionToFrame = (direction, numFrames) => {
  if (numFrames !== 6 && numFrames !== 3) {
    return 0;
  }
  const frames = numFrames === 6 ? 2 : 1;
  if (direction === "down") {
    return 0;
  }
  if (direction === "up") {
    return frames;
  }
  return frames * 2;
};

export const zoomForSection = (section, editor) => {
  if (section === "world") {
    return editor.zoom;
  }
  if (section === "sprites") {
    return editor.zoomSprite;
  }
  if (section === "backgrounds") {
    return editor.zoomImage;
  }
  if (section === "ui") {
    return editor.zoomUI;
  }
  return 100;
};

export const assetFilename = (projectRoot, assetType, asset) => {
  return (
    asset.plugin
      ? Path.join(
          projectRoot,
          "plugins",
          asset.plugin,
          assetType,
          asset.filename
        )
      : Path.join(projectRoot, "assets", assetType, asset.filename)
  ).replace(/\\/g, "/");
};
