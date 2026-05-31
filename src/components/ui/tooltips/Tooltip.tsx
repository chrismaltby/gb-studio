import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { RelativePortal } from "ui/layout/RelativePortal";

const Tooltip = styled.div`
  color: #000;
  background-color: #fff;
  border-radius: 4px;
  overflow: auto;
  box-shadow:
    0 0 0 1px rgba(150, 150, 150, 0.3),
    0 4px 11px hsla(0, 0%, 0%, 0.1);
  z-index: 10000;
  font-size: 11px;
  line-height: normal;
  font-weight: normal;
  padding: 10px;
  max-width: 230px;
  min-width: 150px;
  transform: translateX(-10px);
  white-space: pre-wrap;

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
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isOpen = isControlled ? open : uncontrolledOpen;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const openTooltip = useCallback(() => {
    if (!isControlled) {
      setUncontrolledOpen(true);
    }
  }, [isControlled]);

  const closeTooltip = useCallback(() => {
    if (!isControlled) {
      clearTimer();
      setUncontrolledOpen(false);
    }
  }, [clearTimer, isControlled]);

  const onClick = useCallback(() => {
    openTooltip();
  }, [openTooltip]);

  const onMouseEnter = useCallback(() => {
    if (!isControlled) {
      clearTimer();

      timerRef.current = setTimeout(() => {
        setUncontrolledOpen(true);
        timerRef.current = undefined;
      }, 500);
    }
  }, [clearTimer, isControlled]);

  const onMouseLeave = useCallback(() => {
    closeTooltip();
  }, [closeTooltip]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isOpen && (
        <RelativePortal pin="bottom-left" offsetX={5} offsetY={-5}>
          <Tooltip>{tooltip}</Tooltip>
        </RelativePortal>
      )}
      {children}
    </div>
  );
};
