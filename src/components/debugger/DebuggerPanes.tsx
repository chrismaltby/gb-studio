import React from "react";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import useResizeObserver from "ui/hooks/use-resize-observer";
import DebuggerScriptPane from "components/debugger/DebuggerScriptPane";
import DebuggerVariablesPane from "components/debugger/DebuggerVariablesPane";
import DebuggerVRAMPane from "components/debugger/DebuggerVRAMPane";
import DebuggerState from "components/debugger/DebuggerState";
import DebuggerBreakpointsPane from "components/debugger/DebuggerBreakpointsPane";

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
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const DebuggerPanes = () => {
  const [wrapperEl, wrapperSize] = useResizeObserver<HTMLDivElement>();

  const initialized = useAppSelector((state) => state.debug.initialized);

  const numColumns = !wrapperSize.width
    ? 0
    : wrapperSize.width > 960
    ? 3
    : wrapperSize.width > 560
    ? 2
    : 1;

  return (
    <Wrapper ref={wrapperEl}>
      {!initialized && (
        <NotInitializedWrapper>
          Debugger not connected. Build your game first.
        </NotInitializedWrapper>
      )}
      {initialized && numColumns > 0 && (
        <>
          <Column style={numColumns > 1 ? { maxWidth: COL1_WIDTH } : undefined}>
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
