import { useState, useEffect } from "react";

type SplitDirection = "horizontal" | "vertical";

const useSplitPane = ({
  sizes,
  setSizes,
  minSizes,
  maxTotal,
  collapsedSize = 30,
  reopenSize = 200,
  direction,
}: {
  sizes: number[];
  setSizes: (newSizes: number[]) => void;
  minSizes: number[];
  maxTotal: number;
  collapsedSize?: number;
  reopenSize?: number;
  direction: SplitDirection;
}): [
  (index: number) => (ev: React.MouseEvent<HTMLElement, MouseEvent>) => void,
  (index: number) => void
] => {
  const [startDragSizes, setStartDragSizes] = useState(sizes);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeIndex, setResizeIndex] = useState(-1);

  const height = sizes.reduce((memo, a) => memo + a, 0);
  const unCollapsedHeight = sizes
    .filter((a) => a > collapsedSize)
    .reduce((memo, a) => memo + a, 0);

  // Reset panes to fit height
  useEffect(() => {
    if (maxTotal > 0) {
      const collapsedHeight = height - unCollapsedHeight;
      const unCollapsedNewHeight = maxTotal - collapsedHeight;

      const resetHeights = sizes.map((v) => {
        if (v <= collapsedSize) {
          return v;
        }
        return Math.floor(v * (unCollapsedNewHeight / unCollapsedHeight));
      });

      setSizes(resetHeights);
    }
  }, [maxTotal]);

  const setValueAtIndex = (changedIndex: number, newValue: number) => {
    const currentValue = sizes[changedIndex];
    const diff = newValue - currentValue;

    if (diff > 0) {
      // Moving right, add to current index and subtract from right
      let newValues = sizes.map((v, i) => {
        if (i === changedIndex) {
          return v + diff;
        }
        if (i === changedIndex + 1) {
          return Math.max(minSizes[i], v - diff);
        }
        return v;
      });

      let overAmount =
        minSizes[changedIndex + 1] - (sizes[changedIndex + 1] - diff);

      if (overAmount > 0) {
        // Take overflow from right
        for (let i = changedIndex + 1; i < newValues.length; i++) {
          let prevWidth = newValues[i];
          let newWidth = Math.max(minSizes[i], newValues[i] - overAmount);
          let diffWidth = prevWidth - newWidth;
          overAmount -= diffWidth;
          newValues[i] = newWidth;
        }
      } else {
        // Reuse initial positions if possible
        let pos = 0;
        let offset = 0;
        for (let i = changedIndex; i >= 0; i--) {
          pos += newValues[i];
        }

        for (let i = 0; i < changedIndex + 1; i++) {
          let remaining = pos - offset;
          for (let j = i + 1; j < changedIndex + 1; j++) {
            remaining -= minSizes[j];
          }
          if (i === changedIndex) {
            newValues[i] = Math.min(newValues[i], remaining);
          } else {
            newValues[i] = Math.min(startDragSizes[i], remaining);
          }
          offset += newValues[i];
        }
      }

      if (overAmount <= 0) {
        setSizes(newValues);
      }
    } else if (diff < 0) {
      // Moving left, subtrack from current index and add to right
      let newValues = sizes.map((v, i) => {
        if (i === changedIndex + 1) {
          return v - diff;
        }
        if (i === changedIndex) {
          return Math.max(minSizes[i], v + diff);
        }
        return v;
      });

      let overAmount = minSizes[changedIndex] - (sizes[changedIndex] + diff);

      if (overAmount > 0) {
        // Take overflow from left
        for (let i = changedIndex - 1; i >= 0; i--) {
          let prevWidth = newValues[i];
          let newWidth = Math.max(minSizes[i], newValues[i] - overAmount);
          let diffWidth = prevWidth - newWidth;
          overAmount -= diffWidth;
          newValues[i] = newWidth;
        }
      } else {
        // Reuse initial positions if possible
        let pos = 0;
        let offset = 0;
        for (let i = changedIndex + 1; i < sizes.length; i++) {
          pos += newValues[i];
        }

        for (let i = sizes.length - 1; i > changedIndex; i--) {
          let remaining = pos - offset;
          for (let j = i - 1; j > changedIndex; j--) {
            remaining -= minSizes[j];
          }
          if (i === changedIndex + 1) {
            newValues[i] = Math.min(newValues[i], remaining);
          } else {
            newValues[i] = Math.min(startDragSizes[i], remaining);
          }
          offset += newValues[i];
        }
      }

      if (overAmount <= 0) {
        setSizes(newValues);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", onDragStop);
      return () => {
        window.removeEventListener("mousemove", onDragMove);
        window.removeEventListener("mouseup", onDragStop);
      };
    }
  }, [isResizing, startDragSizes, sizes]);

  const onDragStop = () => {
    setIsResizing(false);
  };

  const onDragMove = (e: MouseEvent) => {
    if (direction === "vertical") {
      setValueAtIndex(resizeIndex, sizes[resizeIndex] + e.movementY);
    } else {
      setValueAtIndex(resizeIndex, sizes[resizeIndex] + e.movementX);
    }
  };

  const onDragStart = (index: number) => (
    _e: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setStartDragSizes(sizes);
    setIsResizing(true);
    setResizeIndex(index);
  };

  const resetSizes = (newSizes: number[]) => {
    const numCollapsed = newSizes.filter((size) => size === collapsedSize)
      .length;
    if (numCollapsed === newSizes.length) {
      // If all panes collapsed open last pane fully
      setSizes(
        newSizes.map((i, index) => {
          if (index < newSizes.length - 1) {
            return collapsedSize;
          }
          return height - (newSizes.length - 1) * collapsedSize;
        })
      );
    } else {
      setSizes(newSizes);
    }
  };

  const onTogglePane = (index: number) => {
    const previousPanelHeight = sizes[index];
    const shouldCollapse = previousPanelHeight !== collapsedSize;
    const collapsedPanels = sizes.map((size) => size === collapsedSize);
    const lastUncollapsedIndex = collapsedPanels.lastIndexOf(false);
    const firstUncollapsedIndex = collapsedPanels.indexOf(false);

    if (shouldCollapse) {
      if (index === firstUncollapsedIndex && index === sizes.length - 1) {
        // Collapse last when only uncollapsed, open first
        const newSizes = sizes.map((size, i) => {
          if (i === index) {
            return collapsedSize;
          } else if (i === 0) {
            return size + previousPanelHeight - collapsedSize;
          }
          return size;
        });
        resetSizes(newSizes);
      } else if (
        index === firstUncollapsedIndex ||
        index < lastUncollapsedIndex
      ) {
        // Collapse upwards
        const newSizes = sizes.map((size, i) => {
          if (i === index) {
            return collapsedSize;
          } else if (i === lastUncollapsedIndex) {
            return size + previousPanelHeight - collapsedSize;
          }
          return size;
        });
        resetSizes(newSizes);
      } else {
        // Collapse downwards
        const previousUncollapsed = collapsedPanels
          .slice(0, index)
          .lastIndexOf(false);

        const newSizes = sizes.map((size, i) => {
          if (i === index) {
            return collapsedSize;
          } else if (i === previousUncollapsed) {
            return size + previousPanelHeight - collapsedSize;
          }
          return size;
        });
        resetSizes(newSizes);
      }
    } else {
      const maxPanelHeight = Math.max(...sizes);
      const maxPanelIndex = sizes.indexOf(maxPanelHeight);
      const newSizes = sizes.map((size, i) => {
        if (i === index) {
          return reopenSize;
        } else if (i === maxPanelIndex) {
          return size - reopenSize + collapsedSize;
        } else {
          return size;
        }
      });
      resetSizes(newSizes);
    }
  };

  return [onDragStart, onTogglePane];
};

export default useSplitPane;
