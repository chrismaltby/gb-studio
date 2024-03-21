import React, { useCallback } from "react";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { actorName, triggerName } from "shared/lib/entities/entitiesHelpers";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";

const Content = styled.div`
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 10px;
  min-height: 50px;
`;

const DataRow = styled.div`
  padding-bottom: 5px;
  &:last-of-type {
    padding-bottom: 0;
  }
`;

const DataLabel = styled.span`
  font-weight: bold;
  padding-right: 5px;
`;

const ValueButton = styled.button`
  background: transparent;
  color: ${(props) => props.theme.colors.text};
  display: inline;
  padding: 0;
  font-size: 11px;
  border: 0;
  margin: 0;
  height: 11px;
  text-align: left;

  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  overflow: hidden;
  line-height: 11px;

  :hover {
    color: ${(props) => props.theme.colors.highlight};
  }
`;

const DebuggerState = () => {
  const dispatch = useAppDispatch();

  const scriptMap = useAppSelector((state) => state.debug.scriptMap);
  const sceneMap = useAppSelector((state) => state.debug.sceneMap);
  const currentScriptSymbol = useAppSelector(
    (state) => state.debug.currentScriptSymbol
  );
  const currentSceneSymbol = useAppSelector(
    (state) => state.debug.currentSceneSymbol
  );

  const currentScriptEvents = scriptMap[currentScriptSymbol] ?? undefined;
  const currentSceneData = sceneMap[currentSceneSymbol] ?? undefined;

  const actor = useAppSelector((state) =>
    actorSelectors.selectById(state, currentScriptEvents?.entityId)
  );
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, currentScriptEvents?.entityId)
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(
      state,
      currentSceneData?.id || currentScriptEvents?.entityId
    )
  );
  const isCollapsed = useAppSelector((state) =>
    getSettings(state).debuggerCollapsedPanes.includes("state")
  );

  const actorIndex = scene?.actors.indexOf(actor?.id ?? "") ?? -1;
  const triggerIndex = scene?.triggers.indexOf(trigger?.id ?? "") ?? -1;

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("state"));
  }, [dispatch]);

  const onSelectScene = useCallback(
    (sceneId: string) => {
      dispatch(editorActions.selectScene({ sceneId }));
      dispatch(editorActions.editSearchTerm(""));
      dispatch(editorActions.editSearchTerm(sceneId));
    },
    [dispatch]
  );

  const onSelectActor = useCallback(
    (actorId: string, sceneId: string) => {
      dispatch(editorActions.selectActor({ sceneId, actorId }));
      dispatch(editorActions.editSearchTerm(""));
      dispatch(editorActions.editSearchTerm(sceneId));
    },
    [dispatch]
  );

  const onSelectTrigger = useCallback(
    (triggerId: string, sceneId: string) => {
      dispatch(
        editorActions.selectTrigger({
          sceneId,
          triggerId,
        })
      );
      dispatch(editorActions.editSearchTerm(""));
      dispatch(editorActions.editSearchTerm(sceneId));
    },
    [dispatch]
  );

  return (
    <>
      <SplitPaneHeader
        onToggle={onToggleCollapsed}
        collapsed={isCollapsed}
        variant="secondary"
      >
        Current State
      </SplitPaneHeader>
      {!isCollapsed && (
        <Content>
          {currentSceneData && (
            <DataRow>
              <DataLabel>Scene:</DataLabel>
              <ValueButton onClick={() => onSelectScene(currentSceneData.id)}>
                {currentSceneData.name}
              </ValueButton>
            </DataRow>
          )}
          {actor && actorIndex > -1 && (
            <DataRow>
              <DataLabel>Actor:</DataLabel>
              <ValueButton
                onClick={() => onSelectActor(actor.id, currentSceneData.id)}
              >
                {actorName(actor, actorIndex)}
              </ValueButton>
            </DataRow>
          )}
          {trigger && triggerIndex > -1 && (
            <DataRow>
              <DataLabel>Trigger:</DataLabel>
              <ValueButton
                onClick={() => onSelectTrigger(trigger.id, currentSceneData.id)}
              >
                {triggerName(trigger, triggerIndex)}
              </ValueButton>
            </DataRow>
          )}
          {currentScriptSymbol && (
            <DataRow>
              <DataLabel>Script:</DataLabel>
              {currentScriptSymbol}
            </DataRow>
          )}
        </Content>
      )}
    </>
  );
};

export default DebuggerState;
