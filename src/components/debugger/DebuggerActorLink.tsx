import React, { useCallback } from "react";
import { actorSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import { LinkButton } from "ui/debugger/LinkButton";

interface DebuggerActorLinkProps {
  id: string;
  sceneId: string;
}

const DebuggerActorLink = ({ id, sceneId }: DebuggerActorLinkProps) => {
  const dispatch = useAppDispatch();
  const actor = useAppSelector((state) => actorSelectors.selectById(state, id));
  const actorIndex = useAppSelector((state) =>
    actorSelectors.selectIds(state).indexOf(id),
  );

  const onSelect = useCallback(() => {
    dispatch(
      editorActions.selectActor({
        sceneId,
        actorId: id,
      }),
    );
    dispatch(editorActions.editSearchTerm(""));
    dispatch(editorActions.editSearchTerm(sceneId));
  }, [dispatch, id, sceneId]);

  if (!actor) {
    return null;
  }

  return (
    <LinkButton onClick={onSelect}>{actorName(actor, actorIndex)}</LinkButton>
  );
};

export default DebuggerActorLink;
