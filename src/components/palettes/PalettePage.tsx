import React, { useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import debounce from "lodash/debounce";
import useResizable from "ui/hooks/use-resizable";
import useWindowSize from "ui/hooks/use-window-size";
import { SplitPaneHorizontalDivider } from "ui/splitpane/SplitPaneDivider";
import editorActions from "store/features/editor/editorActions";
import { paletteSelectors } from "store/features/entities/entitiesSelectors";
import CustomPalettePicker from "components/forms/CustomPalettePicker";
import { PaletteNavigator } from "components/palettes/PaletteNavigator";
import { useAppDispatch, useAppSelector } from "store/hooks";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const Sidebar = styled.div`
  background: ${(props) => props.theme.colors.sidebar.background};
  overflow: hidden;
  position: relative;
`;

const SidebarContent = styled.div`
  min-width: 200px;
  position: relative;
  width: 100%;
  height: 100%;
`;

const Document = styled.div`
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  flex-grow: 1;
  position: relative;
  padding: 20px 40px;
  max-width: 1000px;
  min-width: 500px;
  width: 100%;
  flex-direction: column;
  box-sizing: border-box;
`;

const PalettePage = () => {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.navigation.id);
  const navigatorSidebarWidth = useAppSelector(
    (state) => state.editor.navigatorSidebarWidth,
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const allPalettes = useAppSelector((state) =>
    paletteSelectors.selectAll(state),
  );

  const palette = useAppSelector((state) =>
    paletteSelectors.selectById(state, selectedId),
  );

  const lastPaletteId = useRef("");
  useEffect(() => {
    if (palette) {
      lastPaletteId.current = palette.id;
    }
  }, [palette]);

  const viewPaletteId = useMemo(
    () => palette?.id || lastPaletteId.current || allPalettes[0]?.id,
    [allPalettes, palette],
  );

  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(101, windowWidth - minCenterPaneWidth - 200),
    onResizeComplete: (v) => {
      if (v < 200) {
        setLeftPaneSize(200);
      }
    },
  });

  useEffect(() => {
    prevWindowWidthRef.current = windowWidth;
  });
  const prevWidth = prevWindowWidthRef.current;

  useEffect(() => {
    if (windowWidth !== prevWidth) {
      const panelsTotalWidth = leftPaneWidth + minCenterPaneWidth;
      const widthOverflow = panelsTotalWidth - windowWidth;
      if (widthOverflow > 0) {
        setLeftPaneSize(leftPaneWidth - 0.5 * widthOverflow);
      }
    }
  }, [windowWidth, prevWidth, leftPaneWidth, setLeftPaneSize]);

  const debouncedStoreWidths = useRef(
    debounce((leftPaneWidth: number) => {
      dispatch(editorActions.resizeNavigatorSidebar(leftPaneWidth));
    }, 100),
  );

  useEffect(() => debouncedStoreWidths.current(leftPaneWidth), [leftPaneWidth]);

  return (
    <Wrapper>
      <Sidebar
        style={{
          width: Math.max(200, leftPaneWidth),
        }}
      >
        <SidebarContent>
          <PaletteNavigator
            height={windowHeight - 38}
            selectedId={selectedId}
          />
        </SidebarContent>
      </Sidebar>
      <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
      <Document>
        <Container>
          {viewPaletteId && <CustomPalettePicker paletteId={viewPaletteId} />}
        </Container>
      </Document>
    </Wrapper>
  );
};

export default PalettePage;
