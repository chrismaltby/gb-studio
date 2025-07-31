import React, { useContext } from "react";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  spriteAnimationSelectors,
  spriteSheetSelectors,
  spriteStateSelectors,
} from "store/features/entities/entitiesState";
import { ActorDirection, Palette } from "shared/lib/entities/entitiesTypes";
import { MetaspriteCanvas } from "components/sprites/preview/MetaspriteCanvas";
import { SceneContext } from "components/script/SceneContext";

interface SpriteSheetCanvasProps {
  spriteSheetId: string;
  direction?: ActorDirection;
  frame?: number;
  palettes?: Palette[];
  previewAsMono?: boolean;
  offsetPosition?: boolean;
}

const Wrapper = styled.div`
  position: relative;
`;

const directions: ActorDirection[] = ["right", "left", "up", "down"];

const SpriteSheetCanvas = ({
  spriteSheetId,
  direction = "down",
  frame = 0,
  palettes,
  previewAsMono,
  offsetPosition,
}: SpriteSheetCanvasProps) => {
  const sprite = useAppSelector((state) =>
    spriteSheetSelectors.selectById(state, spriteSheetId),
  );

  const state = useAppSelector((state) =>
    spriteStateSelectors.selectById(state, sprite?.states?.[0] || ""),
  );

  const animations = state?.animations || [];

  // Determine animation to use based on type
  let animationIndex = directions.indexOf(direction);
  if (
    state?.animationType === "fixed" ||
    state?.animationType === "fixed_movement"
  ) {
    animationIndex = 0;
  } else if (state?.animationType === "platform_player") {
    if (animationIndex > 1) {
      animationIndex = 0;
    }
  }
  const flipX = state?.flipLeft && direction === "left";
  if (flipX) {
    animationIndex = 0;
  }
  if (animationIndex < 0) {
    animationIndex = 3;
  }

  const animationId = animations[animationIndex] || "";

  const animation = useAppSelector((state) =>
    spriteAnimationSelectors.selectById(state, animationId),
  );
  const frames = animation?.frames || [];
  const metaspriteId = frames[frame % frames.length] || "";

  const context = useContext(SceneContext);

  if (!sprite || !state) {
    return <div />;
  }

  return (
    <Wrapper
      style={
        offsetPosition
          ? {
              top: -sprite.canvasHeight + 8,
              left: Math.min(0, 8 - sprite.canvasWidth / 2),
            }
          : undefined
      }
    >
      <MetaspriteCanvas
        spriteSheetId={spriteSheetId}
        metaspriteId={metaspriteId}
        palettes={palettes}
        flipX={flipX}
        previewAsMono={previewAsMono}
        spriteMode={context.spriteMode}
      />
    </Wrapper>
  );
};

export default SpriteSheetCanvas;
