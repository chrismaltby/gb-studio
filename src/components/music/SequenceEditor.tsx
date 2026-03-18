import React, { useCallback, useEffect, useMemo, useState } from "react";
import editorActions from "store/features/editor/editorActions";
import styled, { css } from "styled-components";
import { Select } from "ui/form/Select";
import { PlusIcon } from "ui/icons/Icons";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import trackerActions from "store/features/tracker/trackerActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SingleValue } from "react-select";
import { SortableList } from "ui/lists/SortableList";
import { patternHue } from "./helpers";
import l10n from "shared/lib/lang/l10n";

interface SequenceOption {
  value: number;
  label: string;
  shortLabel: string;
}
interface SequenceEditorProps {
  sequence?: number[];
  patterns?: number;
  playingSequence: number;
  height?: number;
  direction: "vertical" | "horizontal";
}

interface SequenceListItem {
  sequenceIndex: number;
  patternId: number;
}

interface SequenceItemProps {
  $active: boolean;
  $selected: boolean;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.colors.sidebar.background};
  flex-shrink: 0;

  .CustomSelect {
    min-width: 0;
  }
`;

const SequenceItem = styled.div<SequenceItemProps>`
  border: 1px solid ${(props) => props.theme.colors.tracker.border};
  background-color: ${(props) => props.theme.colors.button.nestedBackground};
  color: ${(props) => props.theme.colors.input.text};
  padding: 4px;
  min-width: 60px;
  border-radius: 4px;
  box-sizing: border-box;

  ${(props) =>
    props.$selected
      ? css`
          box-shadow: 0 0 0px 4px ${(props) => props.theme.colors.highlight};
        `
      : ""}
`;

const AddSequenceButton = styled.button`
  background: ${(props) => props.theme.colors.button.nestedBackground};
  min-width: 60px;
  min-height: 55px;
  border: 0;
  border-radius: 4px;
  svg {
    fill: ${(props) => props.theme.colors.button.text};
  }
  &:hover {
    background: ${(props) => props.theme.colors.button.nestedActiveBackground};
  }
`;

const SequenceEditorFwd = ({
  sequence,
  patterns,
  playingSequence,
  height,
  direction,
}: SequenceEditorProps) => {
  const dispatch = useAppDispatch();

  const [selectHasFocus, setSelectHasFocus] = useState(false);

  const sequenceId = useAppSelector((state) => state.editor.selectedSequence);
  const setSequenceId = useCallback(
    (sequenceId: number) => {
      dispatch(trackerActions.setSelectedPatternCells([]));
      dispatch(editorActions.setSelectedSequence(sequenceId));
    },
    [dispatch],
  );
  useEffect(() => {
    if (sequence) {
      if (sequenceId >= sequence?.length) {
        setSequenceId(sequence.length - 1);
      }
      if (sequenceId < 0) {
        setSequenceId(0);
      }
    }
  }, [dispatch, sequence, sequenceId, setSequenceId]);

  const play = useAppSelector((state) => state.tracker.playing);

  if (play && playingSequence !== -1) {
    setSequenceId(playingSequence);
  }

  const sequenceOptions: SequenceOption[] = Array.from(
    Array(patterns || 0).keys(),
  )
    .map((i) => ({
      value: i,
      shortLabel: String(i).padStart(2, "0"),
      label: `${l10n("FIELD_PATTERN")} ${String(i).padStart(2, "0")}`,
    }))
    .concat([
      {
        value: -1,
        shortLabel: "",
        label: `${l10n("FIELD_PATTERN")} ${(patterns || 1).toString().padStart(2, "0")} (New)`,
      },
    ]);

  const editSequence = useCallback(
    (index: number, newValue: SequenceOption) => {
      dispatch(
        trackerDocumentActions.editSequence({
          sequenceIndex: index,
          sequenceId: newValue.value,
        }),
      );
    },
    [dispatch],
  );

  const onAddSequence = useCallback(() => {
    dispatch(trackerDocumentActions.addSequence());
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

      let newSelectedIndex = sequenceId;
      if (sequenceId === fromIndex) {
        newSelectedIndex = toIndex;
      } else if (
        fromIndex < toIndex &&
        sequenceId > fromIndex &&
        sequenceId <= toIndex
      ) {
        newSelectedIndex = sequenceId - 1;
      } else if (
        fromIndex > toIndex &&
        sequenceId >= toIndex &&
        sequenceId < fromIndex
      ) {
        newSelectedIndex = sequenceId + 1;
      }

      if (newSelectedIndex !== sequenceId) {
        setSequenceId(newSelectedIndex);
      }
    },
    [dispatch, sequenceId, setSequenceId],
  );

  const sequenceItems = useMemo<SequenceListItem[]>(
    () =>
      (sequence || []).map((patternId, sequenceIndex) => ({
        sequenceIndex,
        patternId,
      })),
    [sequence],
  );

  return (
    <Wrapper style={{ height }}>
      <SortableList
        itemType={"sequence"}
        items={sequenceItems}
        extractKey={(item) => `${item.sequenceIndex}:${item.patternId}`}
        orientation={direction}
        gap={10}
        padding={10}
        selectedIndex={sequenceId}
        onSelect={(item) => {
          setSequenceId(item.sequenceIndex);
        }}
        renderItem={(item, { isSelected }) => (
          <SequenceItem
            $selected={isSelected}
            $active={playingSequence === item.sequenceIndex}
            style={{
              color: "#000",
              background: `linear-gradient(0deg, hsl(${patternHue(item.patternId)}deg 100% 70%) 0%, hsl(${patternHue(item.patternId)}deg 100% 90%) 100%)`,
            }}
          >
            <div style={{ padding: "0 0 2px 2px" }}>
              {item.sequenceIndex + 1}:
            </div>
            <Select
              value={sequenceOptions.find(
                (option) => option.value === item.patternId,
              )}
              formatOptionLabel={(option, { context }) =>
                context === "value" ? option.shortLabel : option.label
              }
              options={sequenceOptions}
              onFocus={() => setSelectHasFocus(true)}
              onBlur={() => setSelectHasFocus(false)}
              onChange={(newValue: SingleValue<SequenceOption>) => {
                if (newValue) {
                  editSequence(item.sequenceIndex, newValue);
                }
              }}
            />
          </SequenceItem>
        )}
        moveItems={onMoveSequence}
        onKeyDown={(e) => {
          if (selectHasFocus) {
            return true;
          }
          if (e.key === "Backspace" || e.key === "Delete") {
            onRemoveSequence();
            return true;
          }
        }}
        appendComponent={
          <AddSequenceButton onClick={onAddSequence}>
            <PlusIcon />
          </AddSequenceButton>
        }
      />
    </Wrapper>
  );
};

export const SequenceEditor = React.memo(SequenceEditorFwd);
