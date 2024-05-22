import type { SlopeIncline } from "store/features/editor/editorState";
import { areRelativelyEqual } from "./math";

export const calculateSlope = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  slopeDirectionHorizontal: "left" | "right",
  slopeDirectionVertical: "left" | "right",
  wallMode: boolean
) => {
  let newEndX = endX;
  let newEndY = endY;
  let slopeIncline: SlopeIncline = "medium";

  const diffX = newEndX - startX;
  const diffY = newEndY - startY;
  const signX = Math.sign(diffX);
  let signY = Math.sign(diffY);

  if (wallMode) {
    if (Math.abs(diffY) > Math.abs(diffX)) {
      // Vertical
      newEndX = startX;
    } else {
      // Horizontal
      newEndY = startY;
    }
  } else if (areRelativelyEqual(Math.abs(diffX), Math.abs(diffY), 0.4)) {
    // drawing 45 degree line
    const length = Math.max(Math.abs(diffX), Math.abs(diffY));
    newEndX = startX + Math.sign(diffX) * length;
    newEndY = startY + Math.sign(diffY) * length;
    slopeIncline = "medium";
  } else {
    if (Math.abs(diffY) > Math.abs(diffX)) {
      // Steep slope - Create 45 deg for now
      const length = Math.max(Math.abs(diffX), Math.abs(diffY));
      newEndX = startX + (Math.sign(diffX) || 1) * length;
      newEndY = startY + Math.sign(diffY) * length;
      slopeIncline = "medium";
    } else {
      // Shallow slope
      slopeIncline = "shallow";
      const length = Math.max(Math.abs(diffX), Math.abs(diffY));

      if (startY === endY) {
        if (slopeDirectionHorizontal === "left") {
          signY = 1;
        } else {
          signY = -1;
        }
      }
      newEndX = startX + signX * length;
      newEndY = startY + signY * length * 0.5;
    }
  }

  return {
    endX: newEndX,
    endY: newEndY,
    slopeIncline,
  };
};
