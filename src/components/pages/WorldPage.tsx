import React, { useCallback, useContext, useEffect, useRef } from "react";
import styled, { ThemeContext } from "styled-components";
import WorldView from "components/world/WorldView";
import ToolPicker from "components/world/ToolPicker";
import BrushToolbar from "components/world/BrushToolbar";
import EditorSidebar from "components/editors/EditorSidebar";
import WorldStatusBar from "components/world/WorldStatusBar";
import useResizable from "ui/hooks/use-resizable";
import useWindowSize from "ui/hooks/use-window-size";
import {
  SplitPaneHorizontalDivider,
  SplitPaneVerticalDivider,
} from "ui/splitpane/SplitPaneDivider";
import { Navigator } from "components/world/Navigator";
import editorActions from "store/features/editor/editorActions";
import settingsActions from "store/features/settings/settingsActions";
import debounce from "lodash/debounce";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import l10n from "shared/lib/lang/l10n";
import DebuggerPanes from "components/debugger/DebuggerPanes";
import DebuggerControls from "components/debugger/DebuggerControls";
import { NAVIGATOR_MIN_WIDTH } from "consts";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const WorldPage = () => {
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const themeContext = useContext(ThemeContext);
  const worldSidebarWidth = useAppSelector(
    (state) => state.editor.worldSidebarWidth
  );
  const navigatorSidebarWidth = useAppSelector(
    (state) => state.editor.navigatorSidebarWidth
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;
  const showNavigator = useAppSelector(
    (state) => state.project.present.settings.showNavigator
  );
  const debuggerEnabled = useAppSelector(
    (state) => state.project.present.settings.debuggerEnabled
  );

  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(
      101,
      windowWidth - minCenterPaneWidth - NAVIGATOR_MIN_WIDTH
    ),
    onResize: (_v) => {
      recalculateRightColumn();
    },
    onResizeComplete: (v) => {
      if (v < 100) {
        hideNavigator();
      }
      if (v < NAVIGATOR_MIN_WIDTH) {
        setLeftPaneSize(NAVIGATOR_MIN_WIDTH);
      }
      recalculateRightColumn();
    },
  });
  const [rightPaneWidth, setRightPaneSize, onResizeRight] = useResizable({
    initialSize: worldSidebarWidth,
    direction: "left",
    minSize: 280,
    maxSize: Math.max(281, windowWidth - minCenterPaneWidth - 100),
    onResize: (_v) => {
      recalculateLeftColumn();
    },
    onResizeComplete: (width) => {
      if (width > windowWidth - NAVIGATOR_MIN_WIDTH) {
        setLeftPaneSize(NAVIGATOR_MIN_WIDTH);
        setRightPaneSize(windowWidth - NAVIGATOR_MIN_WIDTH);
      } else {
        recalculateLeftColumn();
      }
    },
  });
  const centerWidth =
    windowWidth - (showNavigator ? leftPaneWidth : 0) - rightPaneWidth;
  const [debuggerPaneHeight, setDebuggerPaneSize, onResizeDebugger] =
    useResizable({
      initialSize: debuggerEnabled ? 400 : 30,
      direction: "top",
      minSize: 30,
      maxSize: windowHeight - 100,
      onResizeComplete: (height) => {
        if (height === 30 && debuggerEnabled) {
          dispatch(
            settingsActions.editSettings({
              debuggerEnabled: false,
            })
          );
        } else if (height > 30 && !debuggerEnabled) {
          dispatch(
            settingsActions.editSettings({
              debuggerEnabled: true,
            })
          );
        }
      },
    });

  const toggleDebuggerPane = useCallback(() => {
    if (debuggerPaneHeight === 30) {
      setDebuggerPaneSize(windowHeight * 0.5);
      dispatch(
        settingsActions.editSettings({
          debuggerEnabled: true,
        })
      );
    } else {
      setDebuggerPaneSize(30);
      dispatch(
        settingsActions.editSettings({
          debuggerEnabled: false,
        })
      );
    }
  }, [debuggerPaneHeight, dispatch, setDebuggerPaneSize, windowHeight]);

  // Keep track of if debugger is visible
  // If not and it has become visible open to default height
  const debugOpenRef = useRef(debuggerEnabled);
  useEffect(() => {
    if (
      debuggerEnabled &&
      debugOpenRef.current !== debuggerEnabled &&
      debuggerPaneHeight <= 30
    ) {
      setDebuggerPaneSize(windowHeight * 0.5);
    }
    debugOpenRef.current = debuggerEnabled;
  }, [debuggerEnabled, debuggerPaneHeight, setDebuggerPaneSize, windowHeight]);

  useEffect(() => {
    prevWindowWidthRef.current = windowWidth;
  });
  const prevWidth = prevWindowWidthRef.current;

  useEffect(() => {
    if (windowWidth !== prevWidth) {
      const panelsTotalWidth =
        leftPaneWidth + rightPaneWidth + minCenterPaneWidth;
      const widthOverflow = panelsTotalWidth - windowWidth;
      if (widthOverflow > 0) {
        setLeftPaneSize(leftPaneWidth - 0.5 * widthOverflow);
        setRightPaneSize(rightPaneWidth - 0.5 * widthOverflow);
      }
    }
  }, [
    windowWidth,
    prevWidth,
    leftPaneWidth,
    setLeftPaneSize,
    rightPaneWidth,
    setRightPaneSize,
  ]);

  const debouncedStoreWidths = useRef(
    debounce((leftPaneWidth: number, rightPaneWidth: number) => {
      dispatch(editorActions.resizeWorldSidebar(rightPaneWidth));
      dispatch(editorActions.resizeNavigatorSidebar(leftPaneWidth));
    }, 100)
  );

  useEffect(
    () => debouncedStoreWidths.current(leftPaneWidth, rightPaneWidth),
    [leftPaneWidth, rightPaneWidth]
  );

  const recalculateLeftColumn = () => {
    const newWidth = Math.min(
      leftPaneWidth,
      windowWidth - rightPaneWidth - minCenterPaneWidth
    );
    if (newWidth !== leftPaneWidth) {
      setLeftPaneSize(newWidth);
    }
  };

  const recalculateRightColumn = () => {
    const newWidth = Math.min(
      rightPaneWidth,
      windowWidth - leftPaneWidth - minCenterPaneWidth
    );
    if (newWidth !== rightPaneWidth) {
      setRightPaneSize(newWidth);
    }
  };

  const hideNavigator = () => {
    dispatch(settingsActions.setShowNavigator(false));
  };

  const hasFocusForKeyboardShortcuts = useCallback(() => {
    return (
      (document.activeElement === document.body ||
        (documentContainerRef.current &&
          documentContainerRef.current.contains(document.activeElement))) ??
      false
    );
  }, []);

  return (
    <Wrapper>
      <div
        style={{
          transition: "opacity 0.3s ease-in-out",
          width: showNavigator ? leftPaneWidth : 0,
          background: themeContext?.colors.sidebar.background,
          opacity: leftPaneWidth < 100 ? 0.1 : 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            minWidth: NAVIGATOR_MIN_WIDTH,
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          <Navigator />
        </div>
      </div>
      {showNavigator && (
        <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
      )}
      <div
        style={{
          flexGrow: 1,
          minWidth: 0,
          flexShrink: 0,
          overflow: "hidden",
          background: themeContext?.colors.document.background,
          color: themeContext?.colors.text,
          height: windowHeight - 38,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          ref={documentContainerRef}
          style={{
            overflow: "hidden",
            background: themeContext?.colors.document.background,
            color: themeContext?.colors.text,
            flexGrow: 1,
            position: "relative",
          }}
        >
          <WorldView />
          <ToolPicker
            hasFocusForKeyboardShortcuts={hasFocusForKeyboardShortcuts}
          />
          <BrushToolbar
            hasFocusForKeyboardShortcuts={hasFocusForKeyboardShortcuts}
          />
          <WorldStatusBar />
        </div>
        <SplitPaneVerticalDivider onMouseDown={onResizeDebugger} />
        <div
          style={{
            position: "relative",
            height: debuggerPaneHeight,
            maxWidth: centerWidth,
          }}
        >
          <SplitPaneHeader
            onToggle={toggleDebuggerPane}
            collapsed={debuggerPaneHeight <= 30}
            buttons={<DebuggerControls />}
          >
            {l10n("FIELD_DEBUGGER")}
          </SplitPaneHeader>
          {debuggerPaneHeight > 30 && (
            <div style={{ height: debuggerPaneHeight - 30 }}>
              <DebuggerPanes />
            </div>
          )}
        </div>
      </div>
      <SplitPaneHorizontalDivider onMouseDown={onResizeRight} />
      <div
        style={{
          width: rightPaneWidth,
          background: themeContext?.colors.sidebar.background,
          height: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <EditorSidebar />
      </div>
    </Wrapper>
  );
};

export default WorldPage;
