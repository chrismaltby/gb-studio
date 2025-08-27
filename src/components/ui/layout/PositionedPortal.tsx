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

type PositionedPortalProps = {
  children: ReactNode;
  x: number;
  y: number;
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

export const PositionedPortal: FC<PositionedPortalProps> = ({
  children,
  x: initialX,
  y: initialY,
  offsetX = 0,
  offsetY = 0,
  zIndex,
  ...props
}) => {
  const contentsRef = useRef<HTMLDivElement>(null);
  const pin = props.pin ?? "top-left";

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      const contentsHeight = contentsRef.current?.offsetHeight || 0;
      const contentsWidth = contentsRef.current?.offsetWidth || 0;

      let newY = initialY + offsetY;
      let newX = initialX + offsetX;

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
      } else if (props.pin === "parent-edge") {
        if (newX + contentsWidth + MIN_MARGIN > window.innerWidth) {
          newX -= props.parentWidth + contentsWidth;
        }
      } else {
        if (newX + contentsWidth + MIN_MARGIN > window.innerWidth) {
          newX = window.innerWidth - contentsWidth - MIN_MARGIN;
        }
      }

      setY(newY);
      setX(newX);
    };
    update();
    const timer = setInterval(update, 100);
    return () => {
      clearInterval(timer);
    };
  }, [offsetX, offsetY, pin, props.pin, props, initialY, initialX]);

  return (
    <>
      <Portal>
        <div
          style={{
            position: "fixed",
            left: x,
            top: y,
            zIndex,
          }}
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
