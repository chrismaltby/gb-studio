import React from "react";
import { useAppSelector } from "store/hooks";
import styled, { css } from "styled-components";
import { SelectionRect } from "./SongPianoRoll";
import { Selection } from "ui/document/Selection";

interface RollChannelSelectionAreaProps {
  cellSize: number;
  selectionRect?: SelectionRect;
}

interface WrapperProps {
  $rows: number;
  $cols: number;
  $size: number;
  $canSelect: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 0;

  ${(props) => css`
    margin: 0 ${2 * props.$size}px ${2 * props.$size}px 10px;
    width: ${props.$cols * props.$size}px;
    height: ${props.$rows * props.$size}px;
  `}
`;

const RollChannelSelectionAreaFwd = React.forwardRef<
  HTMLDivElement,
  RollChannelSelectionAreaProps
>(({ cellSize, selectionRect }: RollChannelSelectionAreaProps, ref) => {
  const tool = useAppSelector((state) => state.tracker.tool);

  return (
    <Wrapper
      ref={ref}
      $rows={12 * 6}
      $cols={64}
      $size={cellSize}
      $canSelect={tool === "selection"}
    >
      {tool === "selection" && selectionRect && (
        <Selection
          style={{
            pointerEvents: "none",
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}
    </Wrapper>
  );
});

export const RollChannelSelectionArea = React.memo(RollChannelSelectionAreaFwd);
