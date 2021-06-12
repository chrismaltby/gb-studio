import React, { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import { RelativePortal } from "ui/layout/RelativePortal";

export const Tooltip = styled.div`
  color: #000;
  background-color: #fff;
  border-radius: 4px;
  padding: 4px 0;
  overflow: auto;
  box-shadow: 0 0 0 1px rgba(150, 150, 150, 0.3),
    0 4px 11px hsla(0, 0%, 0%, 0.1);
  min-width: 60px;
  z-index: 1001;
  font-size: 11px;
  line-height: normal;
  font-weight: normal;
  padding: 10px;
  max-width: 230px;
  transform: translateX(-10px);
  z-index: 10000;
  white-space: pre-wrap;
  min-width: 150px;

  p {
    margin: 10px 0;
  }
  p:first-child {
    margin-top: 0;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;

interface TooltipWrapperProps {
  children: React.ReactNode;
  tooltip: React.ReactNode;
}

export const TooltipWrapper = ({ children, tooltip }: TooltipWrapperProps) => {
  const [isOpen, setOpen] = useState(false);
  const timer = useRef<number | null>(null);

  const onClick = useCallback(() => {
    setOpen(true);
  }, []);

  const onHoverStart = useCallback(() => {
    timer.current = setTimeout(() => {
      setOpen(true);
    }, 500);
  }, []);

  const onHoverEnd = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setOpen(false);
  }, []);

  return (
    <div onClick={onClick} onMouseOver={onHoverStart} onMouseOut={onHoverEnd}>
      {isOpen && (
        <RelativePortal pin="bottom-left" offsetX={5} offsetY={-5}>
          <Tooltip>{tooltip}</Tooltip>
        </RelativePortal>
      )}
      {children}
    </div>
  );
};
