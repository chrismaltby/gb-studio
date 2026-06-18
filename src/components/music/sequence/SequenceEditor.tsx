import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { PlusIcon } from "ui/icons/Icons";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import trackerActions from "store/features/tracker/trackerActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SortableList } from "ui/lists/SortableList";
import { patternGradient } from "shared/lib/uge/display";
import l10n from "shared/lib/lang/l10n";
import renderSequenceItemContextMenu from "components/music/contextMenus/renderSequenceItemContextMenu";
import { useContextMenu } from "ui/hooks/use-context-menu";
import {
  StyledAddSequenceButton,
  StyledSequenceEditorWrapper,
  StyledSequenceItem,
  StyledSequenceItemBlock,
  StyledSequenceItemBlockHeader,
  StyledSequenceItemDropdown,
  StyledSequenceItemPatterns,
} from "./style";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { getPatternBlockCount } from "store/features/trackerDocument/trackerDocumentHelpers";
import { SequenceItem } from "shared/lib/uge/types";
import { getValidPlaybackSequenceId } from "./helpers";

interface SequenceEditorProps {
  height?: number;
  direction: "vertical" | "horizontal";
}

interface SequenceListItemData {
  sequenceIndex: number;
  sequenceItem: SequenceItem;
}

interface SequenceListItemProps {
  item: SequenceListItemData;
  isSelected: boolean;
  sequenceLength: number;
  numPatterns: number;
  loopSequenceId: number | undefined;
  globalSplitPattern: boolean;
  direction: "vertical" | "horizontal";
}

const SequenceListItem = memo(
  ({
    item,
    isSelected,
    sequenceLength,
    numPatterns,
    loopSequenceId,
    globalSplitPattern,
    direction,
  }: SequenceListItemProps) => {
    const dispatch = useAppDispatch();

    const getContextMenu = useCallback(
      (onClose?: () => void) => {
        return renderSequenceItemContextMenu({
          dispatch,
          sequenceItem: item.sequenceItem,
          orderIndex: item.sequenceIndex,
          orderLength: sequenceLength,
          globalSplitPattern,
          numPatterns,
          loopSequenceId,
          onClose,
        });
      },
      [
        dispatch,
        item.sequenceItem,
        item.sequenceIndex,
        sequenceLength,
        globalSplitPattern,
        numPatterns,
        loopSequenceId,
      ],
    );

    const { onContextMenu, contextMenuElement } = useContextMenu({
      getMenu: ({ closeMenu }) => getContextMenu(closeMenu),
    });

    const contextMenu = useMemo(() => getContextMenu(), [getContextMenu]);

    const isFiltered =
      loopSequenceId !== undefined && loopSequenceId !== item.sequenceIndex;

    return (
      <StyledSequenceItemBlock
        $selected={isSelected}
        $filtered={isFiltered}
        $direction={direction}
        onContextMenu={onContextMenu}
      >
        <StyledSequenceItemBlockHeader>
          {item.sequenceIndex + 1}:
        </StyledSequenceItemBlockHeader>
        {globalSplitPattern || item.sequenceItem.splitPattern ? (
          <StyledSequenceItemPatterns>
            {item.sequenceItem.channels.map((patternId, channelId) => (
              <StyledSequenceItem
                key={channelId}
                $filtered={isFiltered}
                style={{
                  background: patternGradient(
                    Math.floor(patternId / 4),
                    isFiltered,
                    true,
                  ),
                }}
              >
                {String(Math.floor(patternId / 4)).padStart(2, "0")}.
                {patternId % 4}
              </StyledSequenceItem>
            ))}
          </StyledSequenceItemPatterns>
        ) : (
          <StyledSequenceItem
            $filtered={isFiltered}
            style={{
              background: patternGradient(
                Math.floor(item.sequenceItem.channels[0] / 4),
                isFiltered,
                true,
              ),
            }}
          >
            {`${l10n("FIELD_PATTERN")} ${String(
              Math.floor(item.sequenceItem.channels[0] / 4),
            ).padStart(2, "0")}`}
          </StyledSequenceItem>
        )}
        <StyledSequenceItemDropdown>
          <DropdownButton
            variant="transparent"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {contextMenu}
          </DropdownButton>
        </StyledSequenceItemDropdown>
        {contextMenuElement}
      </StyledSequenceItemBlock>
    );
  },
);

const emptySequence: SequenceItem[] = [];

export const SequenceEditor = ({ height, direction }: SequenceEditorProps) => {
  const dispatch = useAppDispatch();

  const sequence = useAppSelector(
    (state) => state.trackerDocument.present.song?.sequence ?? emptySequence,
  );

  const numPatterns = useAppSelector((state) =>
    getPatternBlockCount(state.trackerDocument.present.song?.patterns),
  );

  const sequenceId = useAppSelector((state) => state.tracker.selectedSequence);
  const playingSequence = useAppSelector(
    (state) => state.tracker.playbackSequence,
  );

  const loopSequenceId = useAppSelector(
    (state) => state.tracker.loopSequenceId,
  );

  const globalSplitPattern = useAppSelector(
    (state) => state.tracker.globalSplitPattern,
  );

  const sequenceLengthRef = useRef(sequence?.length ?? 0);

  const setSequenceId = useCallback(
    (sequenceId: number) => {
      dispatch(trackerActions.setSelectedPatternCells([]));
      dispatch(trackerActions.setSelectedSequence(sequenceId));
      if (loopSequenceId !== sequenceId) {
        dispatch(trackerActions.setLoopSequenceId(undefined));
      }
    },
    [dispatch, loopSequenceId],
  );

  useEffect(() => {
    if (sequence) {
      const sequenceItemAboveMax = sequenceId >= sequence?.length;
      const sequenceItemBelowMin = sequenceId < 0;

      if (sequenceItemAboveMax) {
        setSequenceId(sequence.length - 1);
      } else if (sequenceItemBelowMin) {
        setSequenceId(0);
      }

      sequenceLengthRef.current = sequence.length;
    }
  }, [dispatch, sequence, sequenceId, setSequenceId]);

  const play = useAppSelector((state) => state.tracker.playing);

  useEffect(() => {
    const playbackSequenceId = getValidPlaybackSequenceId(
      play,
      playingSequence,
      loopSequenceId,
      sequence.length,
    );

    if (playbackSequenceId !== undefined && playbackSequenceId !== sequenceId) {
      setSequenceId(playbackSequenceId);
    }
  }, [
    play,
    playingSequence,
    loopSequenceId,
    sequence.length,
    sequenceId,
    setSequenceId,
  ]);

  const onAddSequence = useCallback(() => {
    dispatch(
      trackerDocumentActions.insertSequence({
        sequenceIndex: sequenceLengthRef.current,
        position: "after",
      }),
    );
  }, [dispatch]);

  const onRemoveSequence = useCallback(() => {
    dispatch(
      trackerDocumentActions.removeSequence({ sequenceIndex: sequenceId }),
    );
  }, [dispatch, sequenceId]);

  const onMoveSequence = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) {
        return;
      }

      dispatch(trackerDocumentActions.moveSequence({ fromIndex, toIndex }));
    },
    [dispatch],
  );

  const sequenceItems = useMemo<SequenceListItemData[]>(
    () =>
      (sequence || []).map((sequenceItem, sequenceIndex) => ({
        sequenceIndex,
        sequenceItem,
      })),
    [sequence],
  );

  const renderSequenceItem = useCallback(
    (item: SequenceListItemData, { isSelected }: { isSelected: boolean }) => (
      <SequenceListItem
        item={item}
        isSelected={isSelected}
        sequenceLength={sequenceItems.length}
        numPatterns={numPatterns}
        loopSequenceId={loopSequenceId}
        globalSplitPattern={globalSplitPattern}
        direction={direction}
      />
    ),
    [
      sequenceItems.length,
      numPatterns,
      loopSequenceId,
      globalSplitPattern,
      direction,
    ],
  );

  const onSelect = useCallback(
    (item: SequenceListItemData) => {
      setSequenceId(item.sequenceIndex);
    },
    [setSequenceId],
  );

  const extractKey = useCallback(
    (item: SequenceListItemData) =>
      `${item.sequenceIndex}:${item.sequenceItem.channels.join(":")}`,
    [],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isTypingIntoSelect =
        active instanceof HTMLElement &&
        !!active.closest(".CustomSelect__control");
      if (isTypingIntoSelect) {
        return true;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        onRemoveSequence();
        return true;
      }
    },
    [onRemoveSequence],
  );

  const appendComponent = useMemo(
    () => (
      <StyledAddSequenceButton
        onClick={onAddSequence}
        title={l10n("FIELD_ADD_PATTERN")}
      >
        <PlusIcon />
      </StyledAddSequenceButton>
    ),
    [onAddSequence],
  );

  return (
    <StyledSequenceEditorWrapper style={{ height }}>
      <SortableList
        itemType={"sequence"}
        items={sequenceItems}
        extractKey={extractKey}
        orientation={direction}
        gap={10}
        padding={10}
        selectedIndex={sequenceId}
        onSelect={onSelect}
        renderItem={renderSequenceItem}
        moveItems={onMoveSequence}
        onKeyDown={onKeyDown}
        appendComponent={appendComponent}
      />
    </StyledSequenceEditorWrapper>
  );
};
