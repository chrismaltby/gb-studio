import React, { useCallback } from "react";
import { PatternCell } from "shared/lib/uge/types";
import trackerActions from "store/features/tracker/trackerActions";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { StyledPianoRollEffectCell, StyledPianoRollEffectRow } from "./style";
import { PIANO_ROLL_CELL_SIZE } from "consts";

interface PianoRollEffectRowProps {
  patternId: number;
  sequenceId: number;
  channelId: number;
}

type EffectCellChanges = {
  effectcode: number | null;
  effectparam: number | null;
};

const computeEffectChanges = (
  cell?: PatternCell,
  lastCell?: PatternCell,
): EffectCellChanges | null => {
  if (!cell) {
    return null;
  }

  return {
    effectcode:
      cell.effectcode !== null ? cell.effectcode : (lastCell?.effectcode ?? 0),
    effectparam:
      cell.effectparam !== null
        ? cell.effectparam
        : (lastCell?.effectparam ?? 0),
  };
};

const clearEffect = (): EffectCellChanges => ({
  effectcode: null,
  effectparam: null,
});

const selectEffectCell = (sequenceId: number, column: number) => [
  editorActions.setSelectedSequence(sequenceId),
  trackerActions.setSelectedEffectCell(column),
];

const hasEffect = (cell?: PatternCell) =>
  Boolean(cell && (cell.effectcode !== null || cell.effectparam !== null));

export const PianoRollEffectRow = React.memo(
  ({ patternId, sequenceId, channelId }: PianoRollEffectRowProps) => {
    const dispatch = useAppDispatch();

    const tool = useAppSelector((state) => state.tracker.tool);
    const playing = useAppSelector((state) => state.tracker.playing);
    const selectedEffectCell = useAppSelector(
      (state) => state.tracker.selectedEffectCell,
    );
    const selectedSequence = useAppSelector(
      (state) => state.editor.selectedSequence,
    );
    const songDocument = useAppSelector(
      (state) => state.trackerDocument.present.song,
    );

    const renderPattern = songDocument?.patterns[patternId];

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!renderPattern) return;

        const col = Math.floor(e.nativeEvent.offsetX / PIANO_ROLL_CELL_SIZE);
        const cell = renderPattern[col]?.[channelId] as PatternCell | undefined;

        const lastPatternId = songDocument?.sequence[selectedSequence];
        const lastCell =
          lastPatternId !== undefined && selectedEffectCell !== null
            ? (songDocument?.patterns[lastPatternId]?.[selectedEffectCell]?.[
                channelId
              ] as PatternCell | undefined)
            : undefined;

        if (e.button === 0 && tool !== "eraser") {
          const changes = computeEffectChanges(cell, lastCell);

          if (changes) {
            const selectionActions = selectEffectCell(sequenceId, col);

            dispatch(
              trackerDocumentActions.editPatternCell({
                patternId,
                cell: [col, channelId],
                changes,
              }),
            );

            selectionActions.forEach((action) => {
              dispatch(action);
            });
          }
        } else if (e.button === 2 || (tool === "eraser" && e.button === 0)) {
          if (hasEffect(cell)) {
            dispatch(
              trackerDocumentActions.editPatternCell({
                patternId,
                cell: [col, channelId],
                changes: clearEffect(),
              }),
            );
          }
        }
      },
      [
        renderPattern,
        channelId,
        tool,
        dispatch,
        patternId,
        sequenceId,
        selectedEffectCell,
        selectedSequence,
        songDocument,
      ],
    );

    return (
      <StyledPianoRollEffectRow
        onMouseDown={!playing ? handleMouseDown : undefined}
      >
        {renderPattern?.map((column: PatternCell[], columnIdx: number) => {
          const cell = column[channelId];

          const isSelected =
            selectedSequence === sequenceId && selectedEffectCell === columnIdx;

          if (
            !cell ||
            (cell.effectcode === null && cell.effectparam === null)
          ) {
            return null;
          }

          return (
            <StyledPianoRollEffectCell
              key={`fx_${columnIdx}_${channelId}`}
              data-type="note"
              data-column={columnIdx}
              $isSelected={isSelected}
              style={{ left: `${columnIdx * PIANO_ROLL_CELL_SIZE}px` }}
            >
              <span>{cell.effectcode?.toString(16).toUpperCase()}</span>
            </StyledPianoRollEffectCell>
          );
        })}
      </StyledPianoRollEffectRow>
    );
  },
);
