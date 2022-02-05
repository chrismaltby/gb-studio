import { PatternCell } from "lib/helpers/uge/song/PatternCell";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import trackerActions from "store/features/tracker/trackerActions";
import styled, { css } from "styled-components";

interface RollChannelSelectionAreaProps {
  channelId: number;
  patternId: number;
  pattern?: PatternCell[][];
  cellSize: number;
}

interface WrapperProps {
  rows: number;
  cols: number;
  size: number;
  canSelect: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 0;
  margin: 0 10px;
  z-index: 10;
  ${(props) => css`
    width: ${(1 + props.cols) * props.size}px;
    height: ${(1 + props.rows) * props.size}px;
    pointer-events: ${props.canSelect ? "all" : "none"};
  `}
`;

const Selection = styled.div`
  position: absolute;
  background: rgba(128, 128, 128, 0.3);
  border: 1px solid rgba(128, 128, 128, 0.8);
`;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

export const RollChannelSelectionAreaFwd = ({
  cellSize,
  pattern,
  channelId,
}: RollChannelSelectionAreaProps) => {
  const dispatch = useDispatch();

  const tool = useSelector((state: RootState) => state.tracker.tool);
  const gridRef = useRef<HTMLDivElement>(null);

  const [draggingSelection, setDraggingSelection] = useState(false);
  const [selectionOrigin, setSelectionOrigin] =
    useState<Position | undefined>();
  const [selectionRect, setSelectionRect] =
    useState<SelectionRect | undefined>();

  const selectedPatternCells = useSelector(
    (state: RootState) => state.tracker.selectedPatternCells
  );

  useEffect(() => {
    if (tool !== "selection") {
      setDraggingSelection(false);
      setSelectionRect(undefined);
    }
  }, [tool]);

  const selectCellsInRange = useCallback(
    (selectedPatternCells: number[], selectionRect: SelectionRect) => {
      if (pattern) {
        const fromI = selectionRect.x / cellSize;
        const toI = (selectionRect.x + selectionRect.width) / cellSize;
        const fromJ = selectionRect.y / cellSize;
        const toJ = (selectionRect.y + selectionRect.height) / cellSize;

        const newSelectedPatterns = [...selectedPatternCells];
        for (let i = fromI; i < toI; i++) {
          for (let j = fromJ; j < toJ; j++) {
            const note = 12 * 6 - 1 - j;
            if (pattern[i][channelId] && pattern[i][channelId].note === note) {
              newSelectedPatterns.push(i);
            }
          }
        }
        return newSelectedPatterns;
      }
      return [];
    },
    [cellSize, channelId, pattern]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (gridRef.current && tool === "selection" && e.button === 0) {
        const bounds = gridRef.current.getBoundingClientRect();
        const x = clamp(
          Math.floor((e.pageX - bounds.left) / cellSize) * cellSize,
          0,
          63 * cellSize
        );
        const y = clamp(
          Math.floor((e.pageY - bounds.top) / cellSize) * cellSize,
          0,
          12 * 6 * cellSize - cellSize
        );

        const newSelectionRect = { x, y, width: cellSize, height: cellSize };

        const newSelectedPatterns = selectCellsInRange(
          selectedPatternCells,
          newSelectionRect
        );

        setSelectionOrigin({ x, y });
        setSelectionRect(newSelectionRect);
        setDraggingSelection(true);
        dispatch(trackerActions.setSelectedPatternCells(newSelectedPatterns));
      }
    },
    [cellSize, dispatch, selectCellsInRange, selectedPatternCells, tool]
  );

  const handleMouseUp = useCallback(
    (_e: MouseEvent) => {
      if (tool === "selection") {
        setDraggingSelection(false);
        setSelectionRect(undefined);
      }
    },
    [tool]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        tool === "selection" &&
        draggingSelection &&
        selectionRect &&
        gridRef.current &&
        selectionOrigin
      ) {
        const bounds = gridRef.current.getBoundingClientRect();
        const x2 = clamp(
          Math.floor((e.pageX - bounds.left) / cellSize) * cellSize,
          0,
          64 * cellSize
        );
        const y2 = clamp(
          Math.floor((e.pageY - bounds.top) / cellSize) * cellSize,
          0,
          12 * 6 * cellSize
        );

        const x = Math.min(selectionOrigin.x, x2);
        const y = Math.min(selectionOrigin.y, y2);
        const width = Math.abs(selectionOrigin.x - x2);
        const height = Math.abs(selectionOrigin.y - y2);

        setSelectionRect({ x, y, width, height });

        const selectedCells = selectCellsInRange([], selectionRect);
        dispatch(trackerActions.setSelectedPatternCells(selectedCells));
      }
    },
    [
      tool,
      draggingSelection,
      selectionRect,
      selectionOrigin,
      cellSize,
      selectCellsInRange,
      dispatch,
    ]
  );

  const handleMouseLeave = useCallback((_e: MouseEvent) => {
    // setSelecting(false);
  }, []);

  const onSelectAll = useCallback(
    (_e) => {
      const selection = window.getSelection();
      if (!selection || selection.focusNode) {
        return;
      }
      window.getSelection()?.empty();
      const allPatternCells = pattern
        ?.map((c, i) => {
          return c[channelId].note ? i : undefined;
        })
        .filter((c) => c !== undefined) as number[];
      dispatch(trackerActions.setSelectedPatternCells(allPatternCells));
    },
    [channelId, dispatch, pattern]
  );

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  });

  useEffect(() => {
    document.addEventListener("selectionchange", onSelectAll);

    return () => {
      document.removeEventListener("selectionchange", onSelectAll);
    };
  });

  return (
    <Wrapper
      ref={gridRef}
      rows={12 * 6}
      cols={64}
      size={cellSize}
      canSelect={tool === "selection"}
      onMouseLeave={(e) => {
        handleMouseLeave(e.nativeEvent);
      }}
    >
      {draggingSelection && selectionRect && (
        <Selection
          style={{
            pointerEvents: "none",
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}
    </Wrapper>
  );
};

export const RollChannelSelectionArea = React.memo(RollChannelSelectionAreaFwd);
