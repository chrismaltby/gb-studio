import React, { useCallback, useEffect } from "react";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { CheckboxField } from "ui/form/CheckboxField";
import l10n from "shared/lib/lang/l10n";
import API from "renderer/lib/api";
import DebuggerBreakpointItem from "components/debugger/DebuggerBreakpointItem";

const Content = styled.div`
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 10px;

  & > div ~ div {
    margin-top: 5px;
  }
`;

const BreakpointsWrapper = styled.div`
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

const DebuggerBreakpointsPane = () => {
  const dispatch = useAppDispatch();
  const isCollapsed = useAppSelector((state) =>
    getSettings(state).debuggerCollapsedPanes.includes("breakpoints")
  );
  const pauseOnScriptChanged = useAppSelector(
    (state) => getSettings(state).debuggerPauseOnScriptChanged
  );
  const pauseOnWatchedVariableChanged = useAppSelector(
    (state) => getSettings(state).debuggerPauseOnWatchedVariableChanged
  );
  const breakpoints = useAppSelector(
    (state) => getSettings(state).debuggerBreakpoints
  );

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("breakpoints"));
  }, [dispatch]);

  const onTogglePauseOnScriptChange = useCallback(() => {
    API.debugger.setPauseOnScriptChanged(!pauseOnScriptChanged);
    dispatch(
      settingsActions.editSettings({
        debuggerPauseOnScriptChanged: !pauseOnScriptChanged,
      })
    );
  }, [dispatch, pauseOnScriptChanged]);

  const onTogglePauseOnWatchedVariableChange = useCallback(() => {
    API.debugger.setPauseOnWatchVariableChanged(!pauseOnWatchedVariableChanged);
    dispatch(
      settingsActions.editSettings({
        debuggerPauseOnWatchedVariableChanged: !pauseOnWatchedVariableChanged,
      })
    );
  }, [dispatch, pauseOnWatchedVariableChanged]);

  useEffect(() => {
    API.debugger.setBreakpoints(breakpoints.map((b) => b.scriptEventId));
  }, [breakpoints]);

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
            name="pauseOnScriptChanged"
            label={l10n("FIELD_PAUSE_ON_SCRIPT_CHANGE")}
            checked={pauseOnScriptChanged}
            onChange={onTogglePauseOnScriptChange}
          />
          <CheckboxField
            name="pauseOnWatchedVariableChanged"
            label={l10n("FIELD_PAUSE_ON_WATCHED_VAR_CHANGE")}
            checked={pauseOnWatchedVariableChanged}
            onChange={onTogglePauseOnWatchedVariableChange}
          />
        </Content>
      )}
      {!isCollapsed && (
        <BreakpointsWrapper>
          {breakpoints.map((breakpoint) => (
            <DebuggerBreakpointItem
              key={breakpoint.scriptEventId}
              breakpoint={breakpoint}
            />
          ))}
        </BreakpointsWrapper>
      )}
    </>
  );
};

export default DebuggerBreakpointsPane;
