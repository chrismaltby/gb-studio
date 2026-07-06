import React from "react";
import styled from "styled-components";
import { TILE_SIZE } from "consts";
import { AUTOTILE_VARIANT_MASKS } from "shared/lib/tiles/sceneTilemapData";

const Wrapper = styled.div`
  position: absolute;
  outline: 1px solid ${(props) => props.theme.colors.highlightText};
  border-left: 1px solid ${(props) => props.theme.colors.highlight};
  border-top: 1px solid ${(props) => props.theme.colors.highlight};
`;

const TileHint = styled.div`
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border-right: 1px solid ${(props) => props.theme.colors.highlight};
  border-bottom: 1px solid ${(props) => props.theme.colors.highlight};
  width: 8px;
  height: 8px;

  &:after {
    content: "";
    display: block;
    width: 7px;
    height: 7px;
    box-sizing: border-box;
    border: 1px solid ${(props) => props.theme.colors.highlightText};
  }
`;

const Connector = styled.div`
  position: absolute;
  pointer-events: none;
  box-sizing: border-box;
  background: #00e5ff;
  width: 2px;
  height: 2px;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.5));
`;

interface SceneAutotileSelectionProps {
  tileIndex: number;
  tilesetWidth: number;
  type?: "2x2" | "9slice";
}

const SceneAutotileSelection = ({
  tileIndex,
  tilesetWidth,
  type = "2x2",
}: SceneAutotileSelectionProps) => {
  const startX = tileIndex % tilesetWidth;
  const startY = Math.floor(tileIndex / tilesetWidth);

  if (type === "9slice") {
    return (
      <Wrapper
        style={{
          left: startX * TILE_SIZE,
          top: startY * TILE_SIZE,
          width: 3 * TILE_SIZE,
          height: 3 * TILE_SIZE,
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
      style={{
        left: startX * TILE_SIZE,
        top: startY * TILE_SIZE,
        width: 4 * TILE_SIZE,
        height: 4 * TILE_SIZE,
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
