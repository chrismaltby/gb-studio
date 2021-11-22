import React from "react";
import styled, { css } from "styled-components";

interface RollChannelGridProps {
  cellSize: number;
}

interface WrapperProps {
  rows: number;
  cols: number;
  size: number;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 0;
  margin: 0 10px;
  ${(props) => css`
    width: ${props.cols * props.size}px;
    height: ${props.rows * props.size}px;
    background-image: linear-gradient(
        90deg,
        ${props.theme.colors.tracker.rollCell.border} 1px,
        transparent 1px
      ),
      linear-gradient(
        ${props.theme.colors.tracker.rollCell.border} 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        ${props.theme.colors.tracker.rollCell.border} 2px,
        transparent 1px
      ),
      linear-gradient(
        ${props.theme.colors.tracker.rollCell.border} 2px,
        transparent 1px
      );
    border-bottom: 1px solid ${props.theme.colors.tracker.rollCell.border};
    border-right: 2px solid ${props.theme.colors.tracker.rollCell.border};
    background-size: ${props.size}px ${props.size}px,
      ${props.size}px ${props.size}px, ${props.size * 8}px ${props.size * 12}px,
      ${props.size * 8}px ${props.size * 12}px;
  `}
`;

export const RollChannelGridFwd = ({ cellSize }: RollChannelGridProps) => {
  return <Wrapper rows={12 * 6} cols={64} size={cellSize}></Wrapper>;
};

export const RollChannelGrid = React.memo(RollChannelGridFwd);
