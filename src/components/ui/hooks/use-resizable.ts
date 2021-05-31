import { useState, useEffect, useRef, useCallback } from "react";

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

  const clampSize = useCallback(
    (size: number) => {
      return Math.max(minSize, Math.min(maxSize, size));
    },
    [maxSize, minSize]
  );

  const updateSize = useCallback(
    (newSize: number) => {
      onResize?.(clampSize(newSize));
      setSize(newSize);
    },
    [clampSize, onResize]
  );

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

  const onDragMove = useCallback(
    (e: MouseEvent) => {
      if (direction === "left") {
        updateSize(startSize.current - (e.pageX - startOffset.current));
      } else if (direction === "right") {
        updateSize(startSize.current + (e.pageX - startOffset.current));
      } else if (direction === "top") {
        updateSize(startSize.current - (e.pageY - startOffset.current));
      } else if (direction === "bottom") {
        updateSize(startSize.current + (e.pageY - startOffset.current));
      }
    },
    [direction, updateSize]
  );

  const onDragStop = useCallback(() => {
    setIsResizing(false);
    setSize(clampSize(size));
    onResizeComplete?.(clampSize(size));
  }, [clampSize, onResizeComplete, size]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", onDragStop);
      return () => {
        window.removeEventListener("mousemove", onDragMove);
        window.removeEventListener("mouseup", onDragStop);
      };
    }
  }, [isResizing, onDragMove, onDragStop, size]);

  return [clampSize(size), setSize, onDragStart];
};

export default useResizable;
