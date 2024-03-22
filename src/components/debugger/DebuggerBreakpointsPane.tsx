import React, { useCallback } from "react";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { CheckboxField } from "ui/form/CheckboxField";
import l10n from "shared/lib/lang/l10n";
import API from "renderer/lib/api";

const Content = styled.div`
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 10px;
`;

const DebuggerBreakpointsPane = () => {
  const dispatch = useAppDispatch();
  const isCollapsed = useAppSelector((state) =>
    getSettings(state).debuggerCollapsedPanes.includes("breakpoints")
  );
  const pauseOnScriptChange = useAppSelector(
    (state) => getSettings(state).debuggerPauseOnScriptChange
  );

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("breakpoints"));
  }, [dispatch]);

  const onTogglePauseOnScriptChange = useCallback(() => {
    API.debugger.setPauseOnScriptChanged(!pauseOnScriptChange);

    dispatch(
      settingsActions.editSettings({
        debuggerPauseOnScriptChange: !pauseOnScriptChange,
      })
    );
  }, [dispatch, pauseOnScriptChange]);

  return (
    <>
      <SplitPaneHeader
        onToggle={onToggleCollapsed}
        collapsed={isCollapsed}
        variant="secondary"
      >
        Breakpoints
      </SplitPaneHeader>
      {!isCollapsed && (
        <Content>
          <CheckboxField
            name="pauseOnScriptChange"
            label={l10n("FIELD_PAUSE_ON_SCRIPT_CHANGE")}
            checked={pauseOnScriptChange}
            onChange={onTogglePauseOnScriptChange}
          />
        </Content>
      )}
    </>
  );
};

export default DebuggerBreakpointsPane;
