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

export const RelativePortal: FC<RelativePortalProps> = ({
  children,
  offsetX = 0,
  offsetY = 0,
  pin = "top-left",
  zIndex,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        setY(rect.top + offsetY);
        setX(rect.left + offsetX);
      }
    };
    update();
    const timer = setInterval(update, 100);
    return () => {
      clearInterval(timer);
    };
  }, [ref, offsetX, offsetY]);

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
          <div style={pinStyles[pin]}>{children}</div>
        </div>
      </Portal>
    </>
  );
};
