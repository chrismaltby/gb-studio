import React, { useContext, useEffect, useRef } from "react";
import styled, { ThemeContext } from "styled-components";
import World from "../world/World";
import ToolPicker from "../world/ToolPicker";
import BrushToolbar from "../world/BrushToolbar";
import EditorSidebar from "../editors/EditorSidebar";
import StatusBar from "../world/StatusBar";
import useResizable from "ui/hooks/use-resizable";
import useWindowSize from "ui/hooks/use-window-size";
import { SplitPaneHorizontalDivider } from "ui/splitpane/SplitPaneDivider";
import { Navigator } from "../world/Navigator";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import editorActions from "store/features/editor/editorActions";
import settingsActions from "store/features/settings/settingsActions";

import debounce from "lodash/debounce";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const WorldPage = () => {
  const dispatch = useDispatch();
  const themeContext = useContext(ThemeContext);
  const worldSidebarWidth = useSelector(
    (state: RootState) => state.editor.worldSidebarWidth
  );
  const navigatorSidebarWidth = useSelector(
    (state: RootState) => state.editor.navigatorSidebarWidth
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;
  const showNavigator = useSelector(
    (state: RootState) => state.project.present.settings.showNavigator
  );
  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(101, windowWidth - minCenterPaneWidth - 200),
    onResize: (_v) => {
      recalculateRightColumn();
    },
    onResizeComplete: (v) => {
      if (v < 100) {
        hideNavigator();
      }
      if (v < 200) {
        setLeftPaneSize(200);
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
      if (width > windowWidth - 200) {
        setLeftPaneSize(200);
        setRightPaneSize(windowWidth - 200);
      } else {
        recalculateLeftColumn();
      }
    },
  });

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

  return (
    <Wrapper>
      <div
        style={{
          transition: "opacity 0.3s ease-in-out",
          width: showNavigator ? leftPaneWidth : 0,
          background: themeContext.colors.sidebar.background,
          opacity: leftPaneWidth < 100 ? 0.1 : 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            minWidth: 200,
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
          background: themeContext.colors.document.background,
          color: themeContext.colors.text,
          height: windowHeight - 38,
          position: "relative",
        }}
      >
        <World />
        <BrushToolbar />
        <ToolPicker />
        <StatusBar />
      </div>
      <SplitPaneHorizontalDivider onMouseDown={onResizeRight} />
      <div
        style={{
          width: rightPaneWidth,
          background: themeContext.colors.sidebar.background,
          height: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <EditorSidebar multiColumn={rightPaneWidth >= 500} />
      </div>
    </Wrapper>
  );
};

export default WorldPage;
