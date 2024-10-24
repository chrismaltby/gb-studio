import { defaultCollisionTileColor, defaultCollisionTileIcon } from "consts";
import React, { useEffect, useRef } from "react";
import { renderCollisionTileIcon } from "shared/lib/collisions/collisionTiles";
import styled from "styled-components";

interface CollisionTileIconProps {
  icon?: string;
  color?: string;
}

const CollisionTileIconCanvas = styled.canvas`
  image-rendering: pixelated;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: ${(props) => props.theme.colors.input.background};
  border: 2px solid ${(props) => props.theme.colors.input.background};
  outline: 1px solid ${(props) => props.theme.colors.input.border};
`;

export const CollisionTileIcon = ({ icon, color }: CollisionTileIconProps) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;

    const tileIcon = renderCollisionTileIcon(
      icon ?? defaultCollisionTileIcon,
      color ?? defaultCollisionTileColor
    );

    ctx.drawImage(tileIcon, 0, 0);
  }, [icon, color]);

  return (
    <CollisionTileIconCanvas
      ref={ref}
      width="8"
      height="8"
    ></CollisionTileIconCanvas>
  );
};
