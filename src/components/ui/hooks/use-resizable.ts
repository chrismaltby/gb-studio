import { useState, useEffect } from "react";

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
  onResize: (newValue: number) => void;
  onResizeComplete: (newValue: number) => void;
}) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);

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

  const onDragStart = () => {
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
      updateSize(size - e.movementX);
    } else if (direction === "right") {
      updateSize(size + e.movementX);
    } else if (direction === "top") {
      updateSize(size - e.movementY);
    } else if (direction === "bottom") {
      updateSize(size + e.movementY);
    }
  };

  return [clampSize(size), setSize, onDragStart];
};

export default useResizable;
