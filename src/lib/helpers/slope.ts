import { SlopeIncline } from "store/features/editor/editorState";
import { areRelativelyEqual } from "./math";

export const calculateSlope = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  slopeDirectionHorizontal: "left" | "right",
  slopeDirectionVertical: "left" | "right"
) => {
  let newEndX = endX;
  let newEndY = endY;
  let slopeIncline: SlopeIncline = "medium";

  const diffX = newEndX - startX;
  const diffY = newEndY - startY;
  let signX = Math.sign(diffX);
  let signY = Math.sign(diffY);

  if (areRelativelyEqual(Math.abs(diffX), Math.abs(diffY), 0.4)) {
    // drawing 45 degree line
    const length = Math.max(Math.abs(diffX), Math.abs(diffY));
    newEndX = startX + Math.sign(diffX) * length;
    newEndY = startY + Math.sign(diffY) * length;
    slopeIncline = "medium";
  } else {
    if (Math.abs(diffY) > Math.abs(diffX)) {
      // Steep slope
      slopeIncline = "steep";
      const length = Math.max(Math.abs(diffX), Math.abs(diffY));
      if (startX === endX) {
        if (slopeDirectionVertical === "left") {
          signX = -1;
        } else {
          signX = 1;
        }
      }
      newEndX = startX + signX * length * 0.5;
      newEndY = startY + signY * length;
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
