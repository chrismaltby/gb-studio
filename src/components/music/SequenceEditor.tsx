import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import editorActions from "../../store/features/editor/editorActions";
import { RootState } from "../../store/configureStore";
import styled, { css } from "styled-components";
import { Select } from "../ui/form/Select";
// import { PlusIcon } from "../library/Icons";
import trackerActions from "../../store/features/tracker/trackerActions";

interface SequenceOption {
  value: number;
  label: string;
}
interface SequenceEditorProps {
  id: string,
  sequence?: number[],
  patterns?: number,
  playingSequence: number,
  height?: number,
  direction?: "vertical" | "horizontal"
}

interface SequenceItemProps {
  active: boolean,
  selected: boolean,
}

const SequenceItem = styled.div<SequenceItemProps>`
  border: 1px solid ${(props) => props.theme.colors.tracker.border};
  background-color: ${(props) => props.theme.colors.tracker.background};
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
  width: 50px;
  height: 50px;
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
  const dispatch = useDispatch();

  const [hasFocus, setHasFocus] = useState(false);
  const [selectHasFocus, setSelectHasFocus] = useState(false);

  const sequenceId = useSelector(
    (state: RootState) => state.editor.selectedSequence
  );
  const setSequenceId = useCallback(
    (sequenceId: number) => {
      dispatch(editorActions.setSelectedSequence(sequenceId));
    },
    [dispatch]
  );

  const play = useSelector(
    (state: RootState) => state.tracker.playing
  );

  if (play && playingSequence !== -1) {
    setSequenceId(playingSequence);
  }

  const sequenceOptions:SequenceOption[] = Array.from(Array(patterns||0).keys()).map((i) => ({
    value: i,
    label: `${i}`.padStart(2, "0")
  }));

  const editSequence = useCallback((index: number, newValue: SequenceOption) => {
    dispatch(trackerActions.editSequence({
      sequenceIndex: index,
      sequenceId: newValue.value
    }));
  }, [dispatch]);

  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      if (!hasFocus || selectHasFocus) {
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSequenceId(sequenceId - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSequenceId(sequenceId + 1);
      }
    },
    [hasFocus, selectHasFocus, sequenceId, setSequenceId]
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
    <div 
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
      {sequence && sequence.map(
        (item, i) =>
        <div>
          <SequenceItem
            onClick={() => setSequenceId(i)}
            selected={i === sequenceId}
            active={playingSequence === i}
          >
            <div style={{padding: "0 0 2px 2px"}}>{i}:</div> 
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
        </div>
      )}
      {/* <AddSequenceButton>
        <PlusIcon/>
      </AddSequenceButton> */}
    </div>
  )
}

export const SequenceEditor = React.memo(SequenceEditorFwd);