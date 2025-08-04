import React, { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import DebuggerSceneLink from "components/debugger/DebuggerSceneLink";
import l10n from "shared/lib/lang/l10n";

const Content = styled.div`
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 10px;
`;

export const DataRow = styled.div`
  padding-bottom: 5px;
  &:last-of-type {
    padding-bottom: 0;
  }
`;

export const DataLabel = styled.span`
  font-weight: bold;
  padding-right: 5px;
`;

const DebuggerState = () => {
  const dispatch = useAppDispatch();

  const sceneMap = useAppSelector((state) => state.debug.sceneMap);
  const currentSceneSymbol = useAppSelector(
    (state) => state.debug.currentSceneSymbol,
  );
  const scriptContexts = useAppSelector((state) => state.debug.scriptContexts);

  const currentSceneData = sceneMap[currentSceneSymbol] ?? undefined;

  const isCollapsed = useAppSelector((state) =>
    getSettings(state).debuggerCollapsedPanes.includes("state"),
  );

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("state"));
  }, [dispatch]);

  return (
    <>
      <SplitPaneHeader
        onToggle={onToggleCollapsed}
        collapsed={isCollapsed}
        variant="secondary"
      >
        {l10n("FIELD_CURRENT_STATE")}
      </SplitPaneHeader>
      {!isCollapsed && (
        <Content>
          {currentSceneData && (
            <DataRow>
              <DataLabel>{l10n("SCENE")}:</DataLabel>
              <DebuggerSceneLink id={currentSceneData.id} />
            </DataRow>
          )}
          <DataRow>
            <DataLabel>{l10n("FIELD_THREADS")}:</DataLabel>
            {scriptContexts.length}
          </DataRow>
        </Content>
      )}
    </>
  );
};

export default DebuggerState;
