import React from "react";
import styled, { css } from "styled-components";
import { TILE_SIZE } from "consts";
import { AUTOTILE_VARIANT_MASKS } from "shared/lib/tiles/sceneTilemapData";
import { AutotileType } from "shared/lib/resources/types";

const TileHint = styled.div`
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border-right: 1px solid ${(props) => props.theme.colors.highlightText};
  border-bottom: 1px solid ${(props) => props.theme.colors.highlightText};
  width: 8px;
  height: 8px;
`;

const Connector = styled.div`
  position: absolute;
  pointer-events: none;
  box-sizing: border-box;
  background: #00e5ff;
  width: 2px;
  height: 2px;
`;

const Wrapper = styled.div<{ $type: AutotileType }>`
  position: absolute;
  outline: 1px solid ${(props) => props.theme.colors.highlight};
  box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 1);

  ${(props) =>
    props.$type === "2x2" &&
    css`
      width: ${TILE_SIZE * 4}px;
      height: ${TILE_SIZE * 4}px;

      ${TileHint}:nth-child(4n) {
        border-right: 0;
      }
      ${TileHint}:nth-child(n + 13) {
        border-bottom: 0;
      }
    `}

  ${(props) =>
    props.$type === "9slice" &&
    css`
      width: ${TILE_SIZE * 3}px;
      height: ${TILE_SIZE * 3}px;

      ${TileHint}:nth-child(3n) {
        border-right: 0;
      }
      ${TileHint}:nth-child(n + 7) {
        border-bottom: 0;
      }
    `}
`;

interface SceneAutotileSelectionProps {
  tileIndex: number;
  tilesetWidth: number;
  type: AutotileType;
}

const SceneAutotileSelection = ({
  tileIndex,
  tilesetWidth,
  type,
}: SceneAutotileSelectionProps) => {
  const startX = tileIndex % tilesetWidth;
  const startY = Math.floor(tileIndex / tilesetWidth);

  if (type === "9slice") {
    return (
      <Wrapper
        $type={type}
        style={{
          left: startX * TILE_SIZE,
          top: startY * TILE_SIZE,
        }}
      >
        {Array.from({ length: 9 }, (_, variant) => {
          const xi = variant % 3;
          const yi = Math.floor(variant / 3);
          return (
            <TileHint
              key={variant}
              data-autotile-9slice-variant={variant}
              style={{
                left: xi * TILE_SIZE,
                top: yi * TILE_SIZE,
              }}
            >
              {xi <= 1 && yi <= 1 && (
                <Connector
                  style={{
                    right: 0,
                    bottom: 0,
                  }}
                />
              )}
              {xi >= 1 && yi <= 1 && (
                <Connector
                  style={{
                    left: 0,
                    bottom: 0,
                  }}
                />
              )}
              {xi <= 1 && yi >= 1 && (
                <Connector
                  style={{
                    right: 0,
                    top: 0,
                  }}
                />
              )}
              {xi >= 1 && yi >= 1 && (
                <Connector
                  style={{
                    left: 0,
                    top: 0,
                  }}
                />
              )}
            </TileHint>
          );
        })}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      $type={type}
      style={{
        left: startX * TILE_SIZE,
        top: startY * TILE_SIZE,
      }}
    >
      {AUTOTILE_VARIANT_MASKS.map((mask, variant) => {
        const left = (variant % 4) * TILE_SIZE;
        const top = Math.floor(variant / 4) * TILE_SIZE;
        return (
          <TileHint
            key={mask}
            data-autotile-mask={mask}
            style={{
              left,
              top,
            }}
          >
            {!!(mask & 1) && (
              <Connector
                style={{
                  left: 0,
                  top: 0,
                }}
              />
            )}
            {!!(mask & 2) && (
              <Connector
                style={{
                  right: 0,
                  top: 0,
                }}
              />
            )}
            {!!(mask & 4) && (
              <Connector
                style={{
                  right: 0,
                  bottom: 0,
                }}
              />
            )}
            {!!(mask & 8) && (
              <Connector
                style={{
                  left: 0,
                  bottom: 0,
                }}
              />
            )}
          </TileHint>
        );
      })}
    </Wrapper>
  );
};

export default SceneAutotileSelection;
