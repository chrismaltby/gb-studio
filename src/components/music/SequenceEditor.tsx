import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/buttons/Button";
import editorActions from "../../store/features/editor/editorActions";
import { RootState } from "../../store/configureStore";

interface SequenceEditorProps {
  id: string,
  data?: number[],
  playbackState: number[],
  height: number
}

export const SequenceEditor = ({
  data,
  playbackState,
  height
}: SequenceEditorProps) => {
  const dispatch = useDispatch();
  const setSequenceId = useCallback(
    (sequenceId: number) => {
      dispatch(editorActions.setSelectedSequence(sequenceId));
    },
    [dispatch]
  );

  const play = useSelector(
    (state: RootState) => state.tracker.playing
  );

  if (play && playbackState && playbackState[0] !== -1) {
    setSequenceId(playbackState[0]);
  }

  return (
    <div style={{
      height
    }}>
      {data && data.map(
        (item, i) =>
          <div>
          <Button
            variant="transparent"
            onClick={() => setSequenceId(i)}
            active={playbackState[0] === i}
          >
            {item}
          </Button>
        </div>
      )}
    </div>
  )
}