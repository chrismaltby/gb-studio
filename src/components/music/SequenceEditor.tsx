import React, { FC, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "../ui/buttons/Button";
import editorActions from "../../store/features/editor/editorActions";

interface SequenceEditorProps {
  id: string,
  data?: any[]
}

export const SequenceEditor = ({
  id,
  data,
}: SequenceEditorProps) => {

  const dispatch = useDispatch();

  const setSequenceId = useCallback(
    (sequenceId: number) => {
      dispatch(editorActions.setSelectedSequence(sequenceId));
    },
    [dispatch]
  );

  return (
    <div>
      {data && data.map(
      (item) => 
        <Button
          variant="transparent"
          onClick={() => setSequenceId(item)}
        >
          {item}
        </Button>
    )}
    </div>
  )
}