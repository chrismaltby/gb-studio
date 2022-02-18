import React, { useCallback, useEffect, useRef, useState } from "react";
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
  open?: boolean;
}

export const TooltipWrapper = ({
  children,
  tooltip,
  open,
}: TooltipWrapperProps) => {
  const [isOpen, setOpen] = useState(open);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (open !== undefined) {
      setOpen(open);
    }
  }, [open]);

  const onClick = useCallback(() => {
    if (open === undefined) {
      setOpen(true);
    }
  }, [open]);

  const onHoverStart = useCallback(() => {
    if (open === undefined) {
      timer.current = setTimeout(() => {
        setOpen(true);
      }, 500);
    }
  }, [open]);

  const onHoverEnd = useCallback(() => {
    if (open === undefined) {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      setOpen(false);
    }
  }, [open]);

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
