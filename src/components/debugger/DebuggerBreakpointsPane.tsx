import React, { useCallback } from "react";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";

const Content = styled.div`
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 10px;
`;

const DebuggerBreakpointsPane = () => {
  const dispatch = useAppDispatch();
  const isCollapsed = useAppSelector((state) =>
    getSettings(state).debuggerCollapsedPanes.includes("breakpoints")
  );

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("breakpoints"));
  }, [dispatch]);

  return (
    <>
      <SplitPaneHeader
        onToggle={onToggleCollapsed}
        collapsed={isCollapsed}
        variant="secondary"
      >
        Breakpoints
      </SplitPaneHeader>
      {!isCollapsed && <Content></Content>}
    </>
  );
};

export default DebuggerBreakpointsPane;
