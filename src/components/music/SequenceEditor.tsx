import React, { useCallback, useEffect, useState } from "react";
import editorActions from "store/features/editor/editorActions";
import styled, { css } from "styled-components";
import { Select } from "ui/form/Select";
import { PlusIcon } from "ui/icons/Icons";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import trackerActions from "store/features/tracker/trackerActions";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface SequenceOption {
  value: number;
  label: string;
}
interface SequenceEditorProps {
  sequence?: number[];
  patterns?: number;
  playingSequence: number;
  height?: number;
  direction: "vertical" | "horizontal";
}

interface SequenceItemProps {
  active: boolean;
  selected: boolean;
}

const Wrapper = styled.div`
  background-color: ${(props) => props.theme.colors.tracker.background};
`;

const SequenceItem = styled.div<SequenceItemProps>`
  border: 1px solid ${(props) => props.theme.colors.tracker.border};
  background-color: ${(props) => props.theme.colors.button.nestedBackground};
  color: ${(props) => props.theme.colors.input.text};
  padding: 4px;
  margin: 6px;
  min-width: 50px;

  ${(props) =>
    props.selected
      ? css`
          box-shadow: 0 0 0px 4px ${(props) => props.theme.colors.highlight};
        `
      : ""}
`;

const AddSequenceButton = styled.button`
  background: ${(props) => props.theme.colors.button.nestedBackground};
  min-width: 60px;
  min-height: 56px;
  margin: 8px;
  border: 0;
  border-radius: 4px;
  svg {
    fill: ${(props) => props.theme.colors.button.text};
  }
  :hover {
    background: ${(props) => props.theme.colors.button.nestedActiveBackground};
  }
`;

export const SequenceEditorFwd = ({
  sequence,
  patterns,
  playingSequence,
  height,
  direction,
}: SequenceEditorProps) => {
  const dispatch = useAppDispatch();

  const [hasFocus, setHasFocus] = useState(false);
  const [selectHasFocus, setSelectHasFocus] = useState(false);

  const sequenceId = useAppSelector((state) => state.editor.selectedSequence);
  const setSequenceId = useCallback(
    (sequenceId: number) => {
      dispatch(trackerActions.setSelectedPatternCells([]));
      dispatch(editorActions.setSelectedSequence(sequenceId));
    },
    [dispatch]
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
    Array(patterns || 0).keys()
  )
    .map((i) => ({
      value: i,
      label: `${i}`.padStart(2, "0"),
    }))
    .concat([
      {
        value: -1,
        label: `${(patterns || 1).toString().padStart(2, "0")} (New)`,
      },
    ]);

  const editSequence = useCallback(
    (index: number, newValue: SequenceOption) => {
      dispatch(
        trackerDocumentActions.editSequence({
          sequenceIndex: index,
          sequenceId: newValue.value,
        })
      );
    },
    [dispatch]
  );

  const onAddSequence = useCallback(() => {
    dispatch(trackerDocumentActions.addSequence());
  }, [dispatch]);

  const onRemoveSequence = useCallback(() => {
    dispatch(
      trackerDocumentActions.removeSequence({ sequenceIndex: sequenceId })
    );
  }, [dispatch, sequenceId]);

  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      if (!sequence || !hasFocus || selectHasFocus) {
        return;
      }
      if (
        (direction === "vertical" && e.key === "ArrowUp") ||
        (direction === "horizontal" && e.key === "ArrowLeft")
      ) {
        e.preventDefault();
        const id = sequenceId - 1;
        setSequenceId(
          ((id % sequence.length) + sequence.length) % sequence.length
        );
      } else if (
        (direction === "vertical" && e.key === "ArrowDown") ||
        (direction === "horizontal" && e.key === "ArrowRight")
      ) {
        e.preventDefault();
        const id = sequenceId + 1;
        setSequenceId(
          ((id % sequence.length) + sequence.length) % sequence.length
        );
      } else if (e.key === "Backspace" || e.key === "Delete") {
        onRemoveSequence();
      }
    },
    [
      direction,
      hasFocus,
      onRemoveSequence,
      selectHasFocus,
      sequence,
      sequenceId,
      setSequenceId,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    // window.addEventListener("keyup", handleKeysUp);

    return () => {
      window.removeEventListener("keydown", handleKeys);
      // window.removeEventListener("keyup", handleKeysUp);
    };
  });

  return (
    <Wrapper
      tabIndex={0}
      style={{
        height,
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        overflow: direction === "horizontal" ? "auto hidden" : "hidden scroll",
      }}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
    >
      {sequence &&
        sequence.map((item, i) => (
          <SequenceItem
            key={i}
            onClick={() => setSequenceId(i)}
            selected={i === sequenceId}
            active={playingSequence === i}
          >
            <div style={{ padding: "0 0 2px 2px" }}>{i + 1}:</div>
            <Select
              value={sequenceOptions.find((i) => i.value === item)}
              options={sequenceOptions}
              onFocus={() => setSelectHasFocus(true)}
              onBlur={() => setSelectHasFocus(false)}
              onChange={(newValue: SequenceOption) => {
                editSequence(i, newValue);
              }}
            />
          </SequenceItem>
        ))}
      <AddSequenceButton onClick={onAddSequence}>
        <PlusIcon />
      </AddSequenceButton>
    </Wrapper>
  );
};

export const SequenceEditor = React.memo(SequenceEditorFwd);
