import React, { useContext, useEffect, useRef, useState } from "react";
import styled, { ThemeContext } from "styled-components";
import World from "../../components/world/World";
import ToolPicker from "../../components/world/ToolPicker";
import BrushToolbar from "../../components/world/BrushToolbar";
import EditorSidebar from "../../components/editors/EditorSidebar";
import StatusBar from "../../components/world/StatusBar";
import useResizable from "../../components/ui/hooks/use-resizable";
import useWindowSize from "../../components/ui/hooks/use-window-size";
import { Button } from "../../components/ui/buttons/Button";
import {
  ColumnLeftIcon,
  NavigationIcon,
} from "../../components/ui/icons/Icons";
import { SplitPaneHorizontalDivider } from "../../components/ui/splitpane/SplitPaneDivider";
import { Navigator } from "../../components/world/Navigator";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const WorldPage = () => {
  const themeContext = useContext(ThemeContext);
  const windowSize = useWindowSize();
  const minCenterPaneWidth = 0;
  const [showLeftPane, setShowLeftPane] = useState(true);
  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: 200,
    direction: "right",
    minSize: 50,
    maxSize: windowSize.width - minCenterPaneWidth - 200,
    onResize: (v) => {
      setRightPaneSize(
        Math.min(
          rightPaneWidth,
          windowSize.width - leftPaneWidth - minCenterPaneWidth
        )
      );
    },
    onResizeComplete: (v) => {
      if (v < 100) {
        setShowLeftPane(false);
      }
      if (v < 200) {
        setLeftPaneSize(200);
      }
    },
  });
  const [rightPaneWidth, setRightPaneSize, onResizeRight] = useResizable({
    initialSize: 280,
    direction: "left",
    minSize: 280,
    maxSize: windowSize.width - minCenterPaneWidth - 100,
    onResize: (v) => {
      setLeftPaneSize(
        Math.min(
          leftPaneWidth,
          windowSize.width - rightPaneWidth - minCenterPaneWidth
        )
      );
    },
  });

  const prevWidthRef = useRef();
  useEffect(() => {
    prevWidthRef.current = windowSize.width;
  });
  const prevWidth = prevWidthRef.current;

  useEffect(() => {
    if (windowSize.width !== prevWidth) {
      const panelsTotalWidth =
        leftPaneWidth + rightPaneWidth + minCenterPaneWidth;
      const widthOverflow = panelsTotalWidth - windowSize.width;
      if (widthOverflow > 0) {
        setLeftPaneSize(leftPaneWidth - 0.5 * widthOverflow);
        setRightPaneSize(rightPaneWidth - 0.5 * widthOverflow);
      }
    }
  }, [
    windowSize.width,
    prevWidth,
    leftPaneWidth,
    setLeftPaneSize,
    rightPaneWidth,
    setRightPaneSize,
  ]);

  return (
    <Wrapper>
      <div
        style={{
          transition: showLeftPane
            ? "opacity 0.3s ease-in-out"
            : "all 0.1s ease-in-out",
          width: showLeftPane ? leftPaneWidth : 0,
          // background: leftPaneWidth < 100 ? "grey" : "transparent",
          background: themeContext.colors.sidebar.background,
          opacity: leftPaneWidth < 100 ? 0.1 : 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ minWidth: 200, position: "relative", width: "100%", height: "100%" }}>
          <Navigator />
        </div>
      </div>
      {showLeftPane && (
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
          height: windowSize.height - 38,
          position: "relative",
        }}
      >
        <World />
        <BrushToolbar />
        <ToolPicker />
        <StatusBar />
        {!showLeftPane && (
          <div style={{ position: "absolute", top: 210, left: 10, zIndex: 1 }}>
            <Button
              onClick={() => {
                setLeftPaneSize(200);
                setShowLeftPane(true);
              }}
            >
              <ColumnLeftIcon />
            </Button>
          </div>
        )}
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
        <EditorSidebar />
      </div>
    </Wrapper>
  );
};

export default WorldPage;
