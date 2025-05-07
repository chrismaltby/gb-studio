import React, { useContext, useEffect, useMemo, useRef } from "react";
import styled, { ThemeContext } from "styled-components";
import debounce from "lodash/debounce";
import useResizable from "ui/hooks/use-resizable";
import useWindowSize from "ui/hooks/use-window-size";
import { SplitPaneHorizontalDivider } from "ui/splitpane/SplitPaneDivider";
import editorActions from "store/features/editor/editorActions";
import { soundSelectors } from "store/features/entities/entitiesState";
import { NavigatorSounds } from "components/sounds/NavigatorSounds";
import { SoundViewer } from "components/sounds/SoundViewer";
import { useAppDispatch, useAppSelector } from "store/hooks";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const SoundsPage = () => {
  const dispatch = useAppDispatch();
  const themeContext = useContext(ThemeContext);
  const selectedId = useAppSelector((state) => state.navigation.id);
  const navigatorSidebarWidth = useAppSelector(
    (state) => state.editor.navigatorSidebarWidth
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const allSounds = useAppSelector((state) => soundSelectors.selectAll(state));

  const sound = useAppSelector((state) =>
    soundSelectors.selectById(state, selectedId)
  );

  const lastSoundId = useRef("");
  useEffect(() => {
    if (sound) {
      lastSoundId.current = sound.id;
    }
  }, [sound]);

  const viewSoundId = useMemo(
    () => sound?.id || lastSoundId.current || allSounds[0]?.id,
    [allSounds, sound]
  );

  const viewSound = useAppSelector((state) =>
    soundSelectors.selectById(state, viewSoundId)
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
    }, 100)
  );

  useEffect(() => debouncedStoreWidths.current(leftPaneWidth), [leftPaneWidth]);

  return (
    <Wrapper>
      <div
        style={{
          transition: "opacity 0.3s ease-in-out",
          width: Math.max(200, leftPaneWidth),
          background: themeContext?.colors.sidebar.background,
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
          <NavigatorSounds height={windowHeight - 38} selectedId={selectedId} />
        </div>
      </div>
      <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
      <div
        style={{
          flex: "1 1 0",
          minWidth: 0,
          overflow: "hidden",
          background: themeContext?.colors.background,
          color: themeContext?.colors.text,
          height: windowHeight - 38,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flexGrow: 1, position: "relative" }}>
          {viewSound && <SoundViewer file={viewSound} />}
        </div>
      </div>
    </Wrapper>
  );
};

export default SoundsPage;
