import { useState, useEffect, useRef, useCallback } from "react";
import clamp from "lib/helpers/clamp";
import isEqual from "lodash/isEqual";

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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeIndex, setResizeIndex] = useState(-1);
  const startOffset = useRef<number>(0);
  const startAbsSizes = useRef<number[]>([]);

  const height = sizes.reduce((memo, a) => memo + a, 0);

  // Reset panes to fit height
  useEffect(() => {
    if (maxTotal > 0) {
      const unCollapsedHeight = sizes
        .filter((a) => a > collapsedSize)
        .reduce((memo, a) => memo + a, 0);

      const collapsedHeight = height - unCollapsedHeight;
      const unCollapsedNewHeight = maxTotal - collapsedHeight;

      const resetHeights = sizes.map((v) => {
        if (v <= collapsedSize) {
          return v;
        }
        return Math.floor(v * (unCollapsedNewHeight / unCollapsedHeight));
      });
      if (!isEqual(sizes, resetHeights)) {
        setSizes(resetHeights);
      }
    }
  }, [collapsedSize, height, maxTotal, setSizes, sizes]);

  const resizePaneBy = useCallback(
    (resizePane: number, resizeBy: number) => {
      setSizes(
        toSplitRel(
          resizeAbsPaneBy(
            resizePane,
            resizeBy,
            startAbsSizes.current,
            minSizes,
            maxTotal
          )
        )
      );
    },
    [maxTotal, minSizes, setSizes]
  );

  const onDragStop = useCallback(() => {
    setIsResizing(false);
  }, [setIsResizing]);

  const onDragMove = useCallback(
    (e: MouseEvent) => {
      if (direction === "vertical") {
        resizePaneBy(resizeIndex, e.pageY - startOffset.current);
      } else {
        resizePaneBy(resizeIndex, e.pageX - startOffset.current);
      }
    },
    [direction, resizeIndex, resizePaneBy]
  );

  const onDragStart =
    (index: number) => (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      startAbsSizes.current = toSplitAbs(sizes);
      setIsResizing(true);
      setResizeIndex(index);
      if (direction === "horizontal") {
        startOffset.current = e.pageX;
      } else {
        startOffset.current = e.pageY;
      }
    };

  const resetSizes = (newSizes: number[]) => {
    const numCollapsed = newSizes.filter(
      (size) => size === collapsedSize
    ).length;
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

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", onDragStop);
      return () => {
        window.removeEventListener("mousemove", onDragMove);
        window.removeEventListener("mouseup", onDragStop);
      };
    }
  }, [isResizing, onDragMove, onDragStop, sizes]);

  return [onDragStart, onTogglePane];
};

export const toSplitAbs = (arr: number[]) => {
  let total = 0;
  return arr.map((v) => {
    total += v;
    return total;
  });
};

export const toSplitRel = (arr: number[]) => {
  return arr.map((v, i) => {
    if (i === 0) {
      return v;
    }
    return v - arr[i - 1];
  });
};

const add = (a: number, b: number) => a + b;

export const resizeAbsPaneBy = (
  resizePane: number,
  resizeBy: number,
  absStartSizes: number[],
  minSizes: number[],
  maxTotal: number
) => {
  const resizeTo = absStartSizes[resizePane] + resizeBy;
  return absStartSizes.map((v, i) => {
    if (resizeBy < 0) {
      if (i <= resizePane) {
        const splitMin = minSizes.slice(0, i + 1).reduce(add, 0);
        const splitMinBetween = minSizes.slice(i, resizePane).reduce(add, 0);
        return clamp(resizeTo - splitMinBetween, splitMin, v);
      }
    } else if (resizeBy > 0) {
      if (i >= resizePane) {
        const splitMax =
          maxTotal - minSizes.slice(i + 1, minSizes.length).reduce(add, 0);
        const splitMinBetween = minSizes.slice(resizePane, i).reduce(add, 0);
        return clamp(resizeTo + splitMinBetween, v, splitMax);
      }
    }
    return v;
  });
};

export default useSplitPane;
