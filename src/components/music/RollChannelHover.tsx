import React from "react";
import styled, { css } from "styled-components";

interface RollChannelHoverProps {
  cellSize: number;
  hoverColumn: number | null;
  hoverRow: number | null;
}

interface WrapperProps {
  $rows: number;
  $cols: number;
  $size: number;
}

interface HorizontalHoverProps {
  $row: number;
  $size: number;
}

interface VerticalHoverProps {
  $col: number;
  $size: number;
}

const numRows = 12 * 6;
const numCols = 64;

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 0;
  overflow: hidden;
  pointer-events: none;
  ${(props) => css`
    margin: 0 ${3 * props.$size}px ${2 * props.$size}px 10px;
    width: ${props.$cols * props.$size}px;
    height: ${props.$rows * props.$size}px;
  `}
`;

const HorizontalHover = styled.div<HorizontalHoverProps>`
  position: absolute;
  left: 0;
  ${(props) => css`
    background: ${props.theme.colors.tracker.rollCell.border};
    opacity: 0.3;
    top: ${(numCols - props.$row + 7) * props.$size}px;
    width: 100%;
    height: ${props.$size}px;
  `}
`;

const VerticalHover = styled.div<VerticalHoverProps>`
  position: absolute;
  top: 0;
  ${(props) => css`
    background: ${props.theme.colors.tracker.rollCell.border};
    opacity: 0.3;
    left: ${props.$col * props.$size}px;
    width: ${props.$size}px;
    height: 100%;
  `}
`;

export const RollChannelHover = ({
  cellSize,
  hoverColumn,
  hoverRow,
}: RollChannelHoverProps) => {
  if (hoverColumn === null || hoverRow == null) {
    return null;
  }
  return (
    <Wrapper $rows={numRows} $cols={numCols} $size={cellSize}>
      <HorizontalHover $row={hoverRow} $size={cellSize} />
      <VerticalHover $col={hoverColumn} $size={cellSize} />
    </Wrapper>
  );
};
