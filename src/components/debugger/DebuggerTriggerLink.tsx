import React, { useCallback } from "react";
import { triggerSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { triggerName } from "shared/lib/entities/entitiesHelpers";
import { LinkButton } from "ui/debugger/LinkButton";

interface DebuggerTriggerLinkProps {
  id: string;
  sceneId: string;
}

const DebuggerTriggerLink = ({ id, sceneId }: DebuggerTriggerLinkProps) => {
  const dispatch = useAppDispatch();
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, id)
  );
  const triggerIndex = useAppSelector((state) =>
    triggerSelectors.selectIds(state).indexOf(id)
  );

  const onSelect = useCallback(() => {
    dispatch(
      editorActions.selectTrigger({
        sceneId,
        triggerId: id,
      })
    );
    dispatch(editorActions.editSearchTerm(""));
    dispatch(editorActions.editSearchTerm(sceneId));
  }, [dispatch, id, sceneId]);

  if (!trigger) {
    return null;
  }

  return (
    <LinkButton onClick={onSelect}>
      {triggerName(trigger, triggerIndex)}
    </LinkButton>
  );
};

export default DebuggerTriggerLink;
