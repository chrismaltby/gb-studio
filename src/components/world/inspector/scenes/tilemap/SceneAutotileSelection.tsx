import React from "react";
import styled from "styled-components";
import { TILE_SIZE } from "consts";
import { AUTOTILE_VARIANT_MASKS } from "shared/lib/tiles/sceneTilemapData";

const TileHint = styled.div`
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border-style: solid;
  border-color: ${(props) => props.theme.colors.highlight};
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.65),
    0 0 0 1px ${(props) => props.theme.colors.highlightText};
`;

const Connector = styled.div`
  position: absolute;
  pointer-events: none;
  box-sizing: border-box;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 1));
`;

const CONNECTED_COLOR = "#00e5ff";

interface SceneAutotileSelectionProps {
  tileIndex: number;
  tilesetWidth: number;
}

const SceneAutotileSelection = ({
  tileIndex,
  tilesetWidth,
}: SceneAutotileSelectionProps) => {
  const cornerSize = Math.max(2, Math.round(TILE_SIZE * 0.22));
  const borderWidth = Math.max(1, Math.round(TILE_SIZE / 32));
  const startX = tileIndex % tilesetWidth;
  const startY = Math.floor(tileIndex / tilesetWidth);

  return (
    <>
      {AUTOTILE_VARIANT_MASKS.map((mask, variant) => {
        const left = (startX + (variant % 4)) * TILE_SIZE;
        const top = (startY + Math.floor(variant / 4)) * TILE_SIZE;
        return (
          <TileHint
            key={mask}
            data-autotile-mask={mask}
            style={{
              left,
              top,
              width: TILE_SIZE,
              height: TILE_SIZE,
              borderWidth,
            }}
          >
            {!!(mask & 1) && (
              <Connector
                style={{
                  left: 0,
                  top: 0,
                  width: cornerSize,
                  height: cornerSize,
                  background: CONNECTED_COLOR,
                }}
              />
            )}
            {!!(mask & 2) && (
              <Connector
                style={{
                  right: 0,
                  top: 0,
                  width: cornerSize,
                  height: cornerSize,
                  background: CONNECTED_COLOR,
                }}
              />
            )}
            {!!(mask & 4) && (
              <Connector
                style={{
                  right: 0,
                  bottom: 0,
                  width: cornerSize,
                  height: cornerSize,
                  background: CONNECTED_COLOR,
                }}
              />
            )}
            {!!(mask & 8) && (
              <Connector
                style={{
                  left: 0,
                  bottom: 0,
                  width: cornerSize,
                  height: cornerSize,
                  background: CONNECTED_COLOR,
                }}
              />
            )}
          </TileHint>
        );
      })}
    </>
  );
};

export default SceneAutotileSelection;
