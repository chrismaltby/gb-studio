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

const DebuggerVRAMPane = () => {
  const dispatch = useAppDispatch();
  const vramPreview = useAppSelector((state) => state.debug.vramPreview);
  const isCollapsed = useAppSelector((state) =>
    getSettings(state).debuggerCollapsedPanes.includes("vram")
  );

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("vram"));
  }, [dispatch]);

  return (
    <>
      <SplitPaneHeader
        onToggle={onToggleCollapsed}
        collapsed={isCollapsed}
        variant="secondary"
      >
        VRAM
      </SplitPaneHeader>
      {!isCollapsed && (
        <Content>
          <img src={vramPreview} alt=""></img>
        </Content>
      )}
    </>
  );
};

export default DebuggerVRAMPane;
