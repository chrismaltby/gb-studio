import { TILE_SIZE } from "consts";
import React from "react";
import { SceneBoundsRect } from "shared/lib/resources/types";
import styled from "styled-components";

interface SceneScrollBoundsProps {
  width: number;
  height: number;
  scrollBounds: SceneBoundsRect;
}

const BoundsEdge = styled.div`
  position: absolute;
  background: rgba(128, 128, 128, 0.8);
`;

const BoundsOutline = styled.div`
  position: absolute;
  outline: 1px solid rgba(0, 0, 0, 1);
`;

const SceneScrollBounds = ({
  width,
  height,
  scrollBounds,
}: SceneScrollBoundsProps) => {
  return (
    <div
      style={{
        position: "relative",
        width: width * TILE_SIZE,
        height: height * TILE_SIZE,
      }}
    >
      {scrollBounds.x > 0 && (
        <BoundsEdge
          style={{
            left: 0,
            width: scrollBounds.x * TILE_SIZE,
            height: height * TILE_SIZE,
          }}
        />
      )}
      {scrollBounds.y > 0 && (
        <BoundsEdge
          style={{
            left: scrollBounds.x * TILE_SIZE,
            top: 0,
            width: scrollBounds.width * TILE_SIZE,
            height: scrollBounds.y * TILE_SIZE,
          }}
        />
      )}
      {scrollBounds.width < width && (
        <BoundsEdge
          style={{
            right: 0,
            width: (width - scrollBounds.width - scrollBounds.x) * TILE_SIZE,
            height: height * TILE_SIZE,
          }}
        />
      )}
      {scrollBounds.height < height && (
        <BoundsEdge
          style={{
            bottom: 0,
            left: scrollBounds.x * TILE_SIZE,
            width: scrollBounds.width * TILE_SIZE,
            height: (height - scrollBounds.height - scrollBounds.y) * TILE_SIZE,
          }}
        />
      )}

      <BoundsOutline
        style={{
          left: scrollBounds.x * TILE_SIZE,
          top: scrollBounds.y * TILE_SIZE,
          width: scrollBounds.width * TILE_SIZE,
          height: scrollBounds.height * TILE_SIZE,
        }}
      />
    </div>
  );
};

export default SceneScrollBounds;
