import React, {
  CSSProperties,
  FC,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Portal } from "./Portal";

type PinDirection = "top-left" | "bottom-left" | "top-right" | "bottom-right";

export interface RelativePortalProps {
  children: ReactNode;
  offsetX?: number;
  offsetY?: number;
  pin?: PinDirection;
  zIndex?: number;
}

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

export const RelativePortal: FC<RelativePortalProps> = ({
  children,
  offsetX = 0,
  offsetY = 0,
  pin = "top-left",
  zIndex,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const contentsRef = useRef<HTMLDivElement>(null);

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      const rect = ref.current?.getBoundingClientRect();
      const contentsHeight = contentsRef.current?.offsetHeight || 0;
      const contentsWidth = contentsRef.current?.offsetWidth || 0;

      if (rect) {
        let newY = rect.top + offsetY;
        let newX = rect.left + offsetX;

        if (pin === "bottom-left" || pin === "bottom-right") {
          if (newY - contentsHeight - MIN_MARGIN < 0) {
            newY = contentsHeight + MIN_MARGIN;
          }
        } else {
          if (newY + contentsHeight + MIN_MARGIN > window.innerHeight) {
            newY = window.innerHeight - contentsHeight - MIN_MARGIN;
          }
        }

        if (pin === "bottom-right" || pin === "top-right") {
          if (newX - contentsWidth - MIN_MARGIN < 0) {
            newX = contentsWidth + MIN_MARGIN;
          }
        } else {
          if (newX + contentsWidth + MIN_MARGIN > window.innerWidth) {
            newX = window.innerWidth - contentsWidth - MIN_MARGIN;
          }
        }

        setY(newY);
        setX(newX);
      }
    };
    update();
    const timer = setInterval(update, 100);
    return () => {
      clearInterval(timer);
    };
  }, [ref, offsetX, offsetY, pin]);

  return (
    <>
      <div ref={ref} style={{ zIndex: zIndex }} />
      <Portal>
        <div
          style={{
            position: "fixed",
            left: x,
            top: y,
            zIndex,
          }}
        >
          <div ref={contentsRef} style={pinStyles[pin]}>
            {children}
          </div>
        </div>
      </Portal>
    </>
  );
};
