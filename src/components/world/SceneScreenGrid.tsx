import { SCREEN_HEIGHT, SCREEN_WIDTH, TILE_SIZE } from "consts";
import React from "react";
import { SceneBoundsRect } from "shared/lib/resources/types";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";

interface SceneScreenGridProps {
  width: number;
  height: number;
  scrollBounds?: SceneBoundsRect;
}

const ScreenBounds = styled.div`
  position: absolute;
  border: 0.5px solid rgba(0, 219, 157, 0.4);
  box-shadow: 0px 0px 0.5px rgba(0, 219, 157, 0.6);
`;

const SceneScreenGrid = ({
  width,
  height,
  scrollBounds,
}: SceneScreenGridProps) => {
  const showSceneScreenGridAlign = useAppSelector(
    (state) => state.project.present.settings.showSceneScreenGrid,
  );

  const boundsX = scrollBounds?.x ?? 0;
  const boundsY = scrollBounds?.y ?? 0;
  const boundsW = scrollBounds?.width ?? width;
  const boundsH = scrollBounds?.height ?? height;

  return (
    <div
      style={{
        position: "relative",
        width: width * TILE_SIZE,
        height: height * TILE_SIZE,
      }}
    >
      {Array(Math.ceil(width / SCREEN_WIDTH))
        .fill("")
        .map((_, i) => {
          const isLeftAligned =
            showSceneScreenGridAlign === "topLeft" ||
            showSceneScreenGridAlign === "bottomLeft";

          const offset =
            i * SCREEN_WIDTH * TILE_SIZE +
            (isLeftAligned
              ? boundsX * TILE_SIZE
              : (width - boundsX - boundsW) * TILE_SIZE);

          // ❌ Skip if offset is at starting edge
          if (offset === 0) return null;

          return (
            <ScreenBounds
              key={`col-${i}`}
              style={{
                [isLeftAligned ? "left" : "right"]: offset,
                top: 0,
                width: 0,
                height: height * TILE_SIZE,
              }}
            />
          );
        })}

      {Array(Math.ceil(height / SCREEN_HEIGHT))
        .fill("")
        .map((_, i) => {
          const isTopAligned =
            showSceneScreenGridAlign === "topLeft" ||
            showSceneScreenGridAlign === "topRight";

          const offset =
            i * SCREEN_HEIGHT * TILE_SIZE +
            (isTopAligned
              ? boundsY * TILE_SIZE
              : (height - boundsY - boundsH) * TILE_SIZE);

          // ❌ Skip if offset is at starting edge
          if (offset === 0) return null;

          return (
            <ScreenBounds
              key={`row-${i}`}
              style={{
                left: 0,
                [isTopAligned ? "top" : "bottom"]: offset,
                width: width * TILE_SIZE,
                height: 0,
              }}
            />
          );
        })}
    </div>
  );
};

export default SceneScreenGrid;
