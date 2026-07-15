import React, {
  Children,
  CSSProperties,
  FC,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Portal } from "./Portal";
import styled from "styled-components";

export type PinDirection =
  "top-left" | "bottom-left" | "top-right" | "bottom-right";

type RelativePortalProps = {
  children: ReactNode;
  offsetX?: number;
  offsetY?: number;
  zIndex?: number;
} & (
  | {
      pin?: PinDirection;
    }
  | {
      pin: "parent-edge";
      parentWidth: number;
    }
);

const pinStyles: Record<PinDirection, CSSProperties> = {
  "top-left": {
    position: "absolute",
    top: 0,
    left: 0,
  },
  "top-right": {
    position: "absolute",
    top: 0,
    right: 0,
  },
  "bottom-left": {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  "bottom-right": {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
};

const MIN_MARGIN = 10;

const Pin = styled.div`
  background: transparent;
  width: 1px;
  height: 1px;
  margin-right: -1px;
  margin-bottom: -1px;
`;

type PortalState =
  | { type: "idle" }
  | {
      type: "ready";
      x: number;
      y: number;
    };

const hasRenderableChildren = (children: ReactNode): boolean =>
  Children.toArray(children).length > 0;

export const RelativePortal: FC<RelativePortalProps> = ({
  children,
  offsetX = 0,
  offsetY = 0,
  zIndex,
  ...props
}) => {
  const pinRef = useRef<HTMLDivElement>(null);
  const contentsRef = useRef<HTMLDivElement>(null);
  const pin = props.pin ?? "top-left";

  const [portalState, setPortalState] = useState<PortalState>({ type: "idle" });
  const parentWidth = props.pin === "parent-edge" ? props.parentWidth : 0;

  const hasChildren = hasRenderableChildren(children);

  useLayoutEffect(() => {
    if (!hasChildren) {
      setPortalState((prev) =>
        prev.type === "idle" ? prev : { type: "idle" },
      );
      return;
    }

    let frameId: number | undefined;

    const update = () => {
      const rect = pinRef.current?.getBoundingClientRect();
      const contentsHeight = contentsRef.current?.offsetHeight ?? 0;
      const contentsWidth = contentsRef.current?.offsetWidth ?? 0;

      if (!rect) {
        return;
      }

      let newY = rect.top + offsetY;
      let newX = rect.left + offsetX;

      if (pin === "bottom-left" || pin === "bottom-right") {
        if (newY - contentsHeight - MIN_MARGIN < 0) {
          newY = contentsHeight + MIN_MARGIN;
        }
      } else if (newY + contentsHeight + MIN_MARGIN > window.innerHeight) {
        newY = window.innerHeight - contentsHeight - MIN_MARGIN;
      }

      if (pin === "bottom-right" || pin === "top-right") {
        if (newX - contentsWidth - MIN_MARGIN < 0) {
          newX = contentsWidth + MIN_MARGIN;
        }
      } else if (props.pin === "parent-edge") {
        if (newX + contentsWidth + MIN_MARGIN > window.innerWidth) {
          // Not enough room on the right of parent for child content
          if (newX > parentWidth + contentsWidth + MIN_MARGIN) {
            // Enough room to place left of parent instead
            newX -= parentWidth + contentsWidth + MIN_MARGIN;
          } else if (newX - parentWidth > window.innerWidth * 0.3) {
            // If parent location was to right of screen
            // place child on the far left
            newX = MIN_MARGIN;
          } else {
            // Otherwise place at far right of screen
            newX = window.innerWidth - (contentsWidth + MIN_MARGIN);
          }
        }
      } else if (newX + contentsWidth + MIN_MARGIN > window.innerWidth) {
        newX = window.innerWidth - contentsWidth - MIN_MARGIN;
      }

      newX = Math.max(MIN_MARGIN, newX);

      setPortalState((prev) => {
        if (prev.type === "ready" && prev.x === newX && prev.y === newY) {
          return prev;
        }

        return {
          type: "ready",
          x: newX,
          y: newY,
        };
      });
    };

    const loop = () => {
      update();
      frameId = window.requestAnimationFrame(loop);
    };

    update();
    frameId = window.requestAnimationFrame(loop);

    return () => {
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [hasChildren, offsetX, offsetY, pin, props.pin, parentWidth]);

  if (!hasChildren) {
    return null;
  }

  return (
    <>
      <Pin ref={pinRef} />
      <Portal>
        <div
          style={
            portalState.type === "ready"
              ? {
                  position: "fixed",
                  left: portalState.x,
                  top: portalState.y,
                  zIndex,
                }
              : {
                  position: "fixed",
                  left: 0,
                  top: 0,
                  zIndex,
                }
          }
        >
          <div
            ref={contentsRef}
            style={pin !== "parent-edge" ? pinStyles[pin] : undefined}
          >
            {children}
          </div>
        </div>
      </Portal>
    </>
  );
};
