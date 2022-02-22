import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import styled, { css } from "styled-components";
import { SelectionRect } from "./SongPianoRoll";

interface RollChannelSelectionAreaProps {
  cellSize: number;
  selectionRect?: SelectionRect;
}

interface WrapperProps {
  rows: number;
  cols: number;
  size: number;
  canSelect: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 0;
  margin: 0 40px 40px 10px;

  ${(props) => css`
    width: ${props.cols * props.size}px;
    height: ${props.rows * props.size}px;
  `}
`;

const Selection = styled.div`
  position: absolute;
  background: rgba(128, 128, 128, 0.3);
  border: 1px solid rgba(128, 128, 128, 0.8);
`;

export const RollChannelSelectionAreaFwd = React.forwardRef<
  HTMLDivElement,
  RollChannelSelectionAreaProps
>(({ cellSize, selectionRect }: RollChannelSelectionAreaProps, ref) => {
  const tool = useSelector((state: RootState) => state.tracker.tool);

  return (
    <Wrapper
      ref={ref}
      rows={12 * 6}
      cols={64}
      size={cellSize}
      canSelect={tool === "selection"}
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
