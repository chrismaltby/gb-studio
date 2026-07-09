import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSplitPane from "ui/hooks/use-split-pane";

export type SplitPaneLayout =
  | {
      type: "fixed";
      size: number;
      initialMinSize?: number;
      minSize?: number;
      maxSize?: number;
    }
  | {
      type: "fill";
      weight?: number;
      initialMinSize?: number;
      minSize?: number;
      maxSize?: number;
    };

interface UseVerticalSplitPaneProps {
  height: number;
  panelCount: number;
  minPaneSize?: number;
  collapsedSize?: number;
  defaultLayout?: SplitPaneLayout[];
}

interface UseVerticalSplitPaneResult {
  sizes: number[];
  onDragStart: (
    index: number,
  ) => (ev: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  togglePane: (index: number) => void;
  ensurePaneMinHeight: (index: number, requestedHeight: number) => void;
}

const DEFAULT_COLLAPSED_SIZE = 30;

const sum = (values: number[]) =>
  values.reduce((memo, value) => memo + value, 0);

const getSafeMaxSize = (value: number | undefined) =>
  value == null ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(value));

export const getDefaultSizes = (count: number, totalHeight: number) => {
  if (count <= 0) {
    return [];
  }

  const base = Math.floor(totalHeight / count);
  const remainder = totalHeight - base * count;

  return Array.from({ length: count }, (_, index) =>
    index === count - 1 ? base + remainder : base,
  );
};

export const getSizesFromLayout = (
  layout: SplitPaneLayout[],
  count: number,
  totalHeight: number,
) => {
  if (count <= 0) {
    return [];
  }

  const resolvedLayout = layout.slice(0, count);

  while (resolvedLayout.length < count) {
    resolvedLayout.push({ type: "fill", weight: 1 });
  }

  const sizes = new Array<number>(count).fill(0);

  const fillIndexes: number[] = [];
  let fillInitialMinTotal = 0;

  for (let index = 0; index < resolvedLayout.length; index++) {
    const entry = resolvedLayout[index];
    const maxSize = getSafeMaxSize(entry.maxSize);

    if (entry.type === "fill") {
      const initialMinSize = Math.min(
        Math.max(0, Math.floor(entry.initialMinSize ?? 0)),
        maxSize,
      );
      sizes[index] = initialMinSize;
      fillIndexes.push(index);
      fillInitialMinTotal += initialMinSize;
    }
  }

  if (fillInitialMinTotal >= totalHeight) {
    let remaining = totalHeight;

    for (let i = 0; i < fillIndexes.length; i++) {
      const index = fillIndexes[i];
      const size = Math.min(sizes[index], remaining);
      sizes[index] = size;
      remaining -= size;
    }

    return sizes;
  }

  let remainingHeight = totalHeight - fillInitialMinTotal;

  const fixedIndexes: number[] = [];
  let requestedFixedTotal = 0;

  for (let index = 0; index < resolvedLayout.length; index++) {
    const entry = resolvedLayout[index];
    if (entry.type === "fixed") {
      fixedIndexes.push(index);
      requestedFixedTotal += Math.min(
        Math.max(0, Math.floor(entry.size)),
        getSafeMaxSize(entry.maxSize),
      );
    }
  }

  const assignedFixedTotal = Math.min(remainingHeight, requestedFixedTotal);
  remainingHeight -= assignedFixedTotal;

  if (requestedFixedTotal > 0) {
    let usedFixedHeight = 0;
    let lastFixedIndex = -1;

    for (let i = 0; i < fixedIndexes.length; i++) {
      const index = fixedIndexes[i];
      const entry = resolvedLayout[index];
      if (entry.type !== "fixed") {
        continue;
      }

      lastFixedIndex = index;
      const requested = Math.min(
        Math.max(0, Math.floor(entry.size)),
        getSafeMaxSize(entry.maxSize),
      );
      const size = Math.floor(
        (assignedFixedTotal * requested) / requestedFixedTotal,
      );
      sizes[index] = size;
      usedFixedHeight += size;
    }

    const fixedRemainder = assignedFixedTotal - usedFixedHeight;
    if (fixedRemainder > 0 && lastFixedIndex >= 0) {
      const maxSize = getSafeMaxSize(resolvedLayout[lastFixedIndex].maxSize);
      sizes[lastFixedIndex] = Math.min(
        sizes[lastFixedIndex] + fixedRemainder,
        maxSize,
      );
    }
  }

  let growableFillIndexes = fillIndexes.filter((index) => {
    const entry = resolvedLayout[index];
    return sizes[index] < getSafeMaxSize(entry.maxSize);
  });

  while (remainingHeight > 0 && growableFillIndexes.length > 0) {
    const totalWeight = growableFillIndexes.reduce((memo, index) => {
      const entry = resolvedLayout[index];
      if (entry.type === "fill") {
        return memo + Math.max(0, entry.weight ?? 1);
      }
      return memo;
    }, 0);

    if (totalWeight <= 0) {
      break;
    }

    let usedThisPass = 0;
    let lastFillIndex = -1;

    for (let i = 0; i < growableFillIndexes.length; i++) {
      const index = growableFillIndexes[i];
      const entry = resolvedLayout[index];
      if (entry.type !== "fill") {
        continue;
      }

      lastFillIndex = index;

      const weight = Math.max(0, entry.weight ?? 1);
      const maxSize = getSafeMaxSize(entry.maxSize);
      const proposedExtra = Math.floor(
        (remainingHeight * weight) / totalWeight,
      );
      const available = Math.max(0, maxSize - sizes[index]);
      const extraSize = Math.min(proposedExtra, available);

      sizes[index] += extraSize;
      usedThisPass += extraSize;
    }

    if (usedThisPass <= 0) {
      break;
    }

    remainingHeight -= usedThisPass;

    if (remainingHeight > 0 && lastFillIndex >= 0) {
      const maxSize = getSafeMaxSize(resolvedLayout[lastFillIndex].maxSize);
      const extra = Math.min(
        remainingHeight,
        Math.max(0, maxSize - sizes[lastFillIndex]),
      );
      sizes[lastFillIndex] += extra;
      remainingHeight -= extra;
    }

    growableFillIndexes = fillIndexes.filter((index) => {
      const entry = resolvedLayout[index];
      return sizes[index] < getSafeMaxSize(entry.maxSize);
    });
  }

  return sizes;
};

export const getInitialSizes = (
  count: number,
  totalHeight: number,
  layout?: SplitPaneLayout[],
) => {
  if (totalHeight <= 0) {
    return [];
  }

  if (layout && layout.length > 0) {
    return getSizesFromLayout(layout, count, totalHeight);
  }

  return getDefaultSizes(count, totalHeight);
};

export const fitSizesToTotal = (
  currentSizes: number[],
  totalHeight: number,
  minSizes: number[],
  maxSizes: number[],
  collapsedSize: number,
) => {
  const count = currentSizes.length;

  if (count <= 0) {
    return [];
  }

  if (totalHeight <= 0) {
    return new Array<number>(count).fill(0);
  }

  const safeCollapsedSize = Math.max(0, Math.floor(collapsedSize));

  const safeMinSizes = Array.from({ length: count }, (_, index) =>
    Math.max(0, Math.floor(minSizes[index] ?? 0)),
  );

  const safeMaxSizes = Array.from({ length: count }, (_, index) => {
    const minSize = safeMinSizes[index];
    const maxSize = maxSizes[index];
    if (maxSize == null || !Number.isFinite(maxSize)) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.max(minSize, Math.floor(maxSize));
  });

  const preferredSizes = currentSizes.map((size) =>
    Math.max(0, Math.floor(size)),
  );
  const result = new Array<number>(count).fill(0);
  const getPreferredSize = (index: number) =>
    Math.min(
      safeMaxSizes[index],
      Math.max(safeMinSizes[index], preferredSizes[index]),
    );

  // Important: collapsed panes stay collapsed, even if minSize > collapsedSize
  const lockedIndexes = Array.from(
    { length: count },
    (_, index) => index,
  ).filter((index) => preferredSizes[index] <= safeCollapsedSize);

  let remainingHeight = totalHeight;

  for (let i = 0; i < lockedIndexes.length; i++) {
    const index = lockedIndexes[i];
    const lockedSize = preferredSizes[index];
    result[index] = lockedSize;
    remainingHeight -= lockedSize;
  }

  const remainingIndexes = Array.from(
    { length: count },
    (_, index) => index,
  ).filter((index) => !lockedIndexes.includes(index));

  if (remainingIndexes.length === 0) {
    return result;
  }

  if (remainingHeight <= 0) {
    return result;
  }

  const remainingMinSizes = remainingIndexes.map(
    (index) => safeMinSizes[index],
  );

  const remainingMinTotal = sum(remainingMinSizes);

  if (remainingMinTotal >= remainingHeight) {
    const fallback = getDefaultSizes(remainingIndexes.length, remainingHeight);
    for (let i = 0; i < remainingIndexes.length; i++) {
      result[remainingIndexes[i]] = fallback[i] ?? 0;
    }
    return result;
  }

  let activeIndexes = [...remainingIndexes];
  let activeHeight = remainingHeight;

  // First enforce mins if shrinking below them
  while (activeIndexes.length > 0) {
    const activePreferredTotal = sum(activeIndexes.map(getPreferredSize));

    if (activePreferredTotal <= 0) {
      const fallback = getDefaultSizes(activeIndexes.length, activeHeight);
      for (let i = 0; i < activeIndexes.length; i++) {
        result[activeIndexes[i]] = fallback[i] ?? 0;
      }
      break;
    }

    const forcedIndexes: number[] = [];
    for (let i = 0; i < activeIndexes.length; i++) {
      const index = activeIndexes[i];
      const proposed = Math.floor(
        (activeHeight * getPreferredSize(index)) / activePreferredTotal,
      );
      if (proposed < safeMinSizes[index]) {
        forcedIndexes.push(index);
      }
    }

    if (forcedIndexes.length === 0) {
      break;
    }

    for (let i = 0; i < forcedIndexes.length; i++) {
      const index = forcedIndexes[i];
      result[index] = safeMinSizes[index];
      activeHeight -= safeMinSizes[index];
    }

    const forcedIndexSet = new Set(forcedIndexes);
    activeIndexes = activeIndexes.filter((index) => !forcedIndexSet.has(index));
  }

  // Then distribute remaining height proportionally, respecting maxes too
  while (activeIndexes.length > 0) {
    const activePreferredTotal = sum(activeIndexes.map(getPreferredSize));

    if (activePreferredTotal <= 0) {
      const fallback = getDefaultSizes(activeIndexes.length, activeHeight);
      for (let i = 0; i < activeIndexes.length; i++) {
        result[activeIndexes[i]] = fallback[i] ?? 0;
      }
      break;
    }

    const forcedMaxIndexes: number[] = [];
    for (let i = 0; i < activeIndexes.length; i++) {
      const index = activeIndexes[i];
      const proposed = Math.floor(
        (activeHeight * getPreferredSize(index)) / activePreferredTotal,
      );
      if (proposed > safeMaxSizes[index]) {
        forcedMaxIndexes.push(index);
      }
    }

    if (forcedMaxIndexes.length > 0) {
      for (let i = 0; i < forcedMaxIndexes.length; i++) {
        const index = forcedMaxIndexes[i];
        result[index] = safeMaxSizes[index];
        activeHeight -= safeMaxSizes[index];
      }

      const forcedMaxIndexSet = new Set(forcedMaxIndexes);
      activeIndexes = activeIndexes.filter(
        (index) => !forcedMaxIndexSet.has(index),
      );
      continue;
    }

    let used = 0;

    for (let i = 0; i < activeIndexes.length; i++) {
      const index = activeIndexes[i];
      const size = Math.floor(
        (activeHeight * getPreferredSize(index)) / activePreferredTotal,
      );
      result[index] = size;
      used += size;
    }

    let remainder = activeHeight - used;

    // Distribute remainder without exceeding max
    while (remainder > 0) {
      let gaveAny = false;

      for (let i = activeIndexes.length - 1; i >= 0 && remainder > 0; i--) {
        const index = activeIndexes[i];
        if (result[index] < safeMaxSizes[index]) {
          result[index] += 1;
          remainder -= 1;
          gaveAny = true;
        }
      }

      if (!gaveAny) {
        break;
      }
    }

    break;
  }

  return result;
};

const resizeVerticalPaneGroups = (
  startSizes: number[],
  minSizes: number[],
  maxSizes: number[],
  collapsedSize: number,
  dividerIndex: number,
  delta: number,
) => {
  const nextSizes = [...startSizes];
  const count = nextSizes.length;

  if (dividerIndex < 0 || dividerIndex >= count - 1 || delta === 0) {
    return nextSizes;
  }

  const safeCollapsedSize = Math.max(0, Math.floor(collapsedSize));

  const safeMinSizes = Array.from({ length: count }, (_, index) =>
    Math.max(0, Math.floor(minSizes[index] ?? 0)),
  );

  const safeMaxSizes = Array.from({ length: count }, (_, index) => {
    const minSize = safeMinSizes[index];
    const maxSize = maxSizes[index];
    if (maxSize == null || !Number.isFinite(maxSize)) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.max(minSize, Math.floor(maxSize));
  });

  const getShrinkFloor = (index: number) =>
    nextSizes[index] <= safeCollapsedSize
      ? safeCollapsedSize
      : safeMinSizes[index];

  const shrinkRange = (indexes: number[], amount: number) => {
    let remaining = amount;

    for (let i = 0; i < indexes.length && remaining > 0; i++) {
      const index = indexes[i];
      const floor = getShrinkFloor(index);
      const available = Math.max(0, nextSizes[index] - floor);
      const taken = Math.min(available, remaining);
      nextSizes[index] -= taken;
      remaining -= taken;
    }

    return amount - remaining;
  };

  const growRange = (indexes: number[], amount: number) => {
    let remaining = amount;

    for (let i = 0; i < indexes.length && remaining > 0; i++) {
      const index = indexes[i];
      const maxSize = safeMaxSizes[index];
      const available = Math.max(0, maxSize - nextSizes[index]);
      const given = Math.min(available, remaining);
      nextSizes[index] += given;
      remaining -= given;
    }

    return amount - remaining;
  };

  if (delta > 0) {
    // Divider dragged down:
    // grow panes above divider, shrink panes below divider.
    const shrinkOrderBelow = Array.from(
      { length: count - (dividerIndex + 1) },
      (_, offset) => count - 1 - offset,
    );

    const actualShrink = shrinkRange(shrinkOrderBelow, delta);

    const growOrderAbove = Array.from(
      { length: dividerIndex + 1 },
      (_, index) => dividerIndex - index,
    );

    growRange(growOrderAbove, actualShrink);

    return nextSizes;
  }

  // Divider dragged up:
  // grow panes below divider, shrink panes above divider.
  const requestedGrowth = -delta;

  const shrinkOrderAbove = Array.from(
    { length: dividerIndex + 1 },
    (_, index) => index,
  );

  const actualShrink = shrinkRange(shrinkOrderAbove, requestedGrowth);

  const growOrderBelow = Array.from(
    { length: count - (dividerIndex + 1) },
    (_, offset) => dividerIndex + 1 + offset,
  );

  growRange(growOrderBelow, actualShrink);

  return nextSizes;
};

const useVerticalSplitPane = ({
  height,
  panelCount,
  minPaneSize = DEFAULT_COLLAPSED_SIZE,
  collapsedSize = DEFAULT_COLLAPSED_SIZE,
  defaultLayout,
}: UseVerticalSplitPaneProps): UseVerticalSplitPaneResult => {
  const minSizes = useMemo(
    () =>
      Array.from({ length: panelCount }, (_, index) =>
        Math.max(minPaneSize, defaultLayout?.[index]?.minSize ?? 0),
      ),
    [panelCount, minPaneSize, defaultLayout],
  );

  const maxSizes = useMemo(
    () =>
      Array.from({ length: panelCount }, (_, index) => {
        const explicitMax = defaultLayout?.[index]?.maxSize;
        const minSize = minSizes[index] ?? minPaneSize;

        if (explicitMax == null) {
          return Number.POSITIVE_INFINITY;
        }

        return Math.max(minSize, Math.floor(explicitMax));
      }),
    [panelCount, defaultLayout, minSizes, minPaneSize],
  );

  const minSizesKey = useMemo(() => minSizes.join(","), [minSizes]);
  const maxSizesKey = useMemo(
    () =>
      maxSizes
        .map((value) => (Number.isFinite(value) ? value : "inf"))
        .join(","),
    [maxSizes],
  );

  const layoutKey = useMemo(
    () => JSON.stringify(defaultLayout ?? []),
    [defaultLayout],
  );

  const [sizes, setSizesState] = useState<number[]>(() =>
    getInitialSizes(panelCount, height, defaultLayout),
  );

  useLayoutEffect(() => {
    if (height <= 0) {
      return;
    }

    setSizesState((currentSizes) => {
      if (currentSizes.length !== panelCount) {
        return getInitialSizes(panelCount, height, defaultLayout);
      }

      const currentTotal = sum(currentSizes);
      if (currentTotal <= 0) {
        return getInitialSizes(panelCount, height, defaultLayout);
      }

      if (currentTotal === height) {
        return fitSizesToTotal(
          currentSizes,
          height,
          minSizes,
          maxSizes,
          collapsedSize,
        );
      }

      return fitSizesToTotal(
        currentSizes,
        height,
        minSizes,
        maxSizes,
        collapsedSize,
      );
    });
  }, [
    height,
    panelCount,
    collapsedSize,
    minSizes,
    minSizesKey,
    maxSizes,
    maxSizesKey,
    defaultLayout,
    layoutKey,
  ]);

  const resolvedSizes = useMemo(() => {
    if (sizes.length === panelCount && sum(sizes) > 0) {
      return fitSizesToTotal(sizes, height, minSizes, maxSizes, collapsedSize);
    }

    return fitSizesToTotal(
      getInitialSizes(panelCount, height, defaultLayout),
      height,
      minSizes,
      maxSizes,
      collapsedSize,
    );
  }, [
    sizes,
    panelCount,
    height,
    minSizes,
    maxSizes,
    collapsedSize,
    defaultLayout,
  ]);

  const setSizes = useCallback(
    (newSizes: number[], _manuallyEdited: boolean) => {
      setSizesState(
        fitSizesToTotal(newSizes, height, minSizes, maxSizes, collapsedSize),
      );
    },
    [height, minSizes, maxSizes, collapsedSize],
  );

  const ensurePaneMinHeight = useCallback(
    (index: number, requestedHeight: number) => {
      setSizesState((currentSizes) => {
        const workingSizes =
          currentSizes.length === panelCount && sum(currentSizes) > 0
            ? fitSizesToTotal(
                currentSizes,
                height,
                minSizes,
                maxSizes,
                collapsedSize,
              )
            : fitSizesToTotal(
                getInitialSizes(panelCount, height, defaultLayout),
                height,
                minSizes,
                maxSizes,
                collapsedSize,
              );

        const nextSizes = [...workingSizes];
        const currentHeight = nextSizes[index] ?? 0;
        const maxHeight = maxSizes[index] ?? Number.POSITIVE_INFINITY;
        const targetHeight = Math.min(
          maxHeight,
          Math.max(currentHeight, Math.floor(requestedHeight)),
        );

        if (targetHeight <= currentHeight) {
          return workingSizes;
        }

        let extraNeeded = targetHeight - currentHeight;
        nextSizes[index] = targetHeight;

        for (let i = nextSizes.length - 1; i >= 0 && extraNeeded > 0; i--) {
          if (i === index) {
            continue;
          }

          const minSize = minSizes[i] ?? minPaneSize;
          const available = Math.max(0, nextSizes[i] - minSize);
          const taken = Math.min(available, extraNeeded);

          nextSizes[i] -= taken;
          extraNeeded -= taken;
        }

        if (extraNeeded > 0) {
          nextSizes[index] -= extraNeeded;
        }

        return fitSizesToTotal(
          nextSizes,
          height,
          minSizes,
          maxSizes,
          collapsedSize,
        );
      });
    },
    [
      panelCount,
      height,
      minSizes,
      maxSizes,
      minPaneSize,
      collapsedSize,
      defaultLayout,
    ],
  );

  const [, togglePane] = useSplitPane({
    sizes: resolvedSizes,
    setSizes,
    minSizes,
    maxTotal: height,
    collapsedSize,
    direction: "vertical",
  });

  const dragStartY = useRef(0);
  const dragIndex = useRef(-1);
  const dragStartSizes = useRef<number[]>([]);
  const isDragging = useRef(false);

  const stopDragging = useCallback(() => {
    isDragging.current = false;
    dragIndex.current = -1;
  }, []);

  const onDragMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging.current || dragIndex.current < 0) {
        return;
      }

      const delta = event.pageY - dragStartY.current;

      const nextSizes = resizeVerticalPaneGroups(
        dragStartSizes.current,
        minSizes,
        maxSizes,
        collapsedSize,
        dragIndex.current,
        delta,
      );

      setSizesState(
        fitSizesToTotal(nextSizes, height, minSizes, maxSizes, collapsedSize),
      );
    },
    [height, minSizes, maxSizes, collapsedSize],
  );

  useEffect(() => {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [onDragMove, stopDragging]);

  const onDragStart = useCallback(
    (index: number) => (ev: React.MouseEvent<HTMLElement, MouseEvent>) => {
      dragStartY.current = ev.pageY;
      dragIndex.current = index;
      dragStartSizes.current = [...resolvedSizes];
      isDragging.current = true;
    },
    [resolvedSizes],
  );

  return {
    sizes: resolvedSizes,
    onDragStart,
    togglePane,
    ensurePaneMinHeight,
  };
};

export default useVerticalSplitPane;
