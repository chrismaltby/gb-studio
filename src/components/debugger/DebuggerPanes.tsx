import React, { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import useResizeObserver from "ui/hooks/use-resize-observer";
import DebuggerScriptPane from "components/debugger/DebuggerScriptPane";
import DebuggerVariablesPane from "components/debugger/DebuggerVariablesPane";
import DebuggerVRAMPane from "components/debugger/DebuggerVRAMPane";
import DebuggerState from "components/debugger/DebuggerState";
import DebuggerBreakpointsPane from "components/debugger/DebuggerBreakpointsPane";
import DebuggerPausedPane from "components/debugger/DebuggerPausedPane";
import buildGameActions from "store/features/buildGame/buildGameActions";
import { Button } from "ui/buttons/Button";
import l10n from "shared/lib/lang/l10n";
import DebuggerBuildLog from "components/debugger/DebuggerBuildLog";

const COL1_WIDTH = 290;
const COL2_WIDTH = 350;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  background: ${(props) => props.theme.colors.scripting.form.background};

  img {
    image-rendering: pixelated;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  box-sizing: border-box;
  overflow-y: auto;
  border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
  font-size: 11px;

  &:last-of-type {
    border-right: 0;
  }
`;

const NotInitializedWrapper = styled.div`
  font-size: 11px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100px;
  button {
    margin-top: 10px;
  }
`;

const DebuggerPanes = () => {
  const dispatch = useAppDispatch();
  const [wrapperEl, wrapperSize] = useResizeObserver<HTMLDivElement>();

  const initialized = useAppSelector((state) => state.debug.initialized);
  const buildStatus = useAppSelector((state) => state.console.status);
  const isLogOpen = useAppSelector((state) => state.debug.isLogOpen);

  const running = buildStatus === "running";

  const onRun = useCallback(() => {
    dispatch(
      buildGameActions.buildGame({
        buildType: "web",
        exportBuild: false,
        debugEnabled: true,
      }),
    );
  }, [dispatch]);

  const numColumns = !wrapperSize.width
    ? 0
    : wrapperSize.width > 960
      ? 3
      : wrapperSize.width > 560
        ? 2
        : 1;

  if (isLogOpen) {
    return (
      <Wrapper ref={wrapperEl}>
        <DebuggerBuildLog />
      </Wrapper>
    );
  }

  return (
    <Wrapper ref={wrapperEl}>
      {!initialized && (
        <NotInitializedWrapper>
          {l10n("FIELD_DEBUGGER_NOT_CONNECTED")}
          <Button onClick={onRun} disabled={running}>
            {running ? l10n("FIELD_BUILDING") : l10n("FIELD_START_DEBUGGER")}
          </Button>
        </NotInitializedWrapper>
      )}
      {initialized && numColumns > 0 && (
        <>
          <Column style={numColumns > 1 ? { maxWidth: COL1_WIDTH } : undefined}>
            <DebuggerPausedPane />
            <DebuggerVRAMPane />
            <DebuggerState />
            <DebuggerBreakpointsPane />
            {numColumns < 3 && <DebuggerVariablesPane collapsible={true} />}
            {numColumns < 2 && <DebuggerScriptPane collapsible={true} />}
          </Column>
          {numColumns > 2 && (
            <Column style={{ maxWidth: COL2_WIDTH }}>
              <DebuggerVariablesPane />
            </Column>
          )}
          {numColumns > 1 && (
            <Column
              style={{
                maxWidth:
                  numColumns === 3
                    ? `calc(100% - ${COL1_WIDTH}px - ${COL2_WIDTH}px)`
                    : `calc(100% - ${COL1_WIDTH}px)`,
              }}
            >
              <DebuggerScriptPane />
            </Column>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default DebuggerPanes;
