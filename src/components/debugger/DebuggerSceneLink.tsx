import React, { useCallback } from "react";
import { sceneSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import { LinkButton } from "ui/debugger/LinkButton";

interface DebuggerSceneLinkProps {
  id: string;
}

const DebuggerSceneLink = ({ id }: DebuggerSceneLinkProps) => {
  const dispatch = useAppDispatch();
  const scene = useAppSelector((state) => sceneSelectors.selectById(state, id));
  const sceneIndex = useAppSelector((state) =>
    sceneSelectors.selectIds(state).indexOf(id)
  );

  const onSelect = useCallback(() => {
    dispatch(editorActions.selectScene({ sceneId: id }));
    dispatch(editorActions.editSearchTerm(""));
    dispatch(editorActions.editSearchTerm(id));
  }, [dispatch, id]);

  if (!scene) {
    return null;
  }

  return (
    <LinkButton onClick={onSelect}>{sceneName(scene, sceneIndex)}</LinkButton>
  );
};

export default DebuggerSceneLink;
