import styled, { css } from "styled-components";

export const UsageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  flex-wrap: nowrap;
  flex-direction: row;
  gap: 6px;
  flex-grow: 2;
`;

export const Total = styled.div`
  display: inline-block;
  position: relative;
  width: 100%;
  background-color: black;
  height: 20px;
  border-radius: ${(props) => props.theme.borderRadius}px;
  border: 1px solid ${(props) => props.theme.colors.input.border};
  overflow: hidden;
  max-width: 150px;
`;

/** Region has been filled past its capacity, the game will not run correctly */
export const OVERFLOW_COLOR = "#e20e2b";

export const Used = styled.div<{ $overflow?: boolean }>`
  display: inline-block;
  position: absolute;
  left: 0;
  background-color: ${(props) =>
    props.$overflow ? OVERFLOW_COLOR : props.theme.colors.highlight};
  height: inherit;
  transition: width 0.3s ease-in-out;
  pointer-events: none;
`;

export const UsageLabel = styled.div<{ $overflow?: boolean }>`
  ${(props) =>
    props.$overflow
      ? css`
          color: ${OVERFLOW_COLOR};
          font-weight: bold;
        `
      : ""}
`;

export const SizeStep = styled.div`
  position: relative;
  display: inline-block;
  height: inherit;
  border-right: 1px solid ${(props) => props.theme.colors.input.border};
  transition: width 0.3s ease-in-out;

  &:hover {
    background-color: #191919;
  }
`;

export const FullSizeStep = styled(SizeStep)`
  width: 100%;
  border-right: 0;
`;

export const TooltipChild = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
`;

export const renderSize = (bytes: number, showBytes: boolean) => {
  if (bytes < 1024 || showBytes) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${parseFloat(kb.toFixed(2))} KiB`;
  } else {
    const mb = bytes / (1024 * 1024);
    return `${parseFloat(mb.toFixed(2))} MiB`;
  }
};
