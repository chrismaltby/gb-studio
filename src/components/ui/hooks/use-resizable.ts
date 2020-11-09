import { useState, useEffect, useRef } from "react";

type ResizeDirection = "left" | "right" | "top" | "bottom";

const useResizable = ({
  initialSize,
  minSize = 0,
  maxSize = Infinity,
  direction = "right",
  onResize,
  onResizeComplete,
}: {
  initialSize: number;
  minSize: number;
  maxSize: number;
  direction: ResizeDirection;
  onResize?: (newValue: number) => void;
  onResizeComplete?: (newValue: number) => void;
}): [
  number,
  React.Dispatch<React.SetStateAction<number>>,
  (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
] => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const startSize = useRef<number>(0);
  const startOffset = useRef<number>(0);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", onDragStop);
      return () => {
        window.removeEventListener("mousemove", onDragMove);
        window.removeEventListener("mouseup", onDragStop);
      };
    }
  }, [isResizing, size]);

  const onDragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (direction === "left" || direction === "right") {
      startOffset.current = e.pageX;
    } else {
      startOffset.current = e.pageY;
    }
    startSize.current = size;
    setIsResizing(true);
    setSize(clampSize(size));
  };

  const onDragStop = () => {
    setIsResizing(false);
    setSize(clampSize(size));
    onResizeComplete?.(clampSize(size));
  };

  const clampSize = (size: number) => {
    return Math.max(minSize, Math.min(maxSize, size));
  };

  const updateSize = (newSize: number) => {
    onResize?.(clampSize(newSize));
    setSize(newSize);
  };

  const onDragMove = (e: MouseEvent) => {
    if (direction === "left") {
      updateSize(startSize.current - (e.pageX - startOffset.current));
    } else if (direction === "right") {
      updateSize(startSize.current + (e.pageX - startOffset.current));
    } else if (direction === "top") {
      updateSize(startSize.current - (e.pageY - startOffset.current));
    } else if (direction === "bottom") {
      updateSize(startSize.current + (e.pageY - startOffset.current));
    }
  };

  return [clampSize(size), setSize, onDragStart];
};

export default useResizable;
